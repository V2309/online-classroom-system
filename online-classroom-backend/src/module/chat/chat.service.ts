import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';
import { PusherService } from '../../lib/pusher/pusher.service';
import { SendMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pusher: PusherService,
  ) {}

  // ─── GET /chat/class/:classCode/initial ──────────────────────────────────
  async getInitialChatData(classCode: string, userId: string, role: string) {
    const cls = await this.prisma.class.findUnique({
      where: { class_code: classCode, deleted: false },
      include: {
        students: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                username: true,
                img: true,
              },
            },
          },
        },
        supervisor: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                username: true,
                img: true,
              },
            },
          },
        },
      },
    });

    if (!cls) throw new NotFoundException('Lớp học không tồn tại.');

    // 1. Lấy 50 tin nhắn gần nhất
    const rawMessages = await this.prisma.message.findMany({
      where: { classCode },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            img: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Sắp xếp theo thứ tự tăng dần
    const messages = rawMessages.reverse().map((msg) => ({
      id: msg.id.toString(),
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      isPinned: msg.isPinned || false,
      pinnedAt: msg.pinnedAt?.toISOString(),
      replyTo: msg.replyToId
        ? {
            id: msg.replyToId.toString(),
            content: msg.replyToContent || '',
            user: {
              id: 'unknown',
              username: msg.replyToUsername || 'Unknown',
              img: null,
            },
          }
        : undefined,
      user: {
        id: msg.user.id,
        username: msg.user.username,
        img: msg.user.img,
      },
    }));

    // 2. Danh sách thành viên lớp học (Sử dụng User.id để khớp với Pusher Presence Channel user_id)
    const allMembers: Array<{
      id: string;
      username: string;
      img: string | null;
      isOnline: boolean;
      role: 'student' | 'teacher';
    }> = [
      ...cls.students.map((s) => ({
        id: s.user.id,
        username: s.user.username,
        img: s.user.img,
        isOnline: false,
        role: 'student' as const,
      })),
    ];

    if (cls.supervisor) {
      allMembers.push({
        id: cls.supervisor.user.id,
        username: cls.supervisor.user.username,
        img: cls.supervisor.user.img,
        isOnline: false,
        role: 'teacher' as const,
      });
    }

    return {
      messages,
      allMembers,
    };
  }

  // ─── POST /chat/messages — Gửi tin nhắn mới ──────────────────────────────
  async sendMessage(userId: string, dto: SendMessageDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, img: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy thông tin người dùng.');

    const cls = await this.prisma.class.findUnique({
      where: { class_code: dto.classCode, deleted: false },
    });
    if (!cls) throw new NotFoundException('Lớp học không tồn tại.');

    // 1. Lưu tin nhắn vào DB
    const newMessage = await this.prisma.message.create({
      data: {
        content: dto.content,
        classCode: dto.classCode,
        userId: user.id,
        replyToId: dto.replyTo?.id ? parseInt(dto.replyTo.id, 10) : null,
        replyToContent: dto.replyTo?.content || null,
        replyToUsername: dto.replyTo?.user.username || null,
      },
      include: {
        user: {
          select: { username: true, img: true },
        },
      },
    });

    // 2. Bắn sự kiện Pusher
    const channelName = `presence-class-${dto.classCode}`;
    const eventPayload = {
      id: newMessage.id.toString(),
      content: newMessage.content,
      createdAt: newMessage.createdAt.toISOString(),
      user: {
        id: user.id,
        username: newMessage.user.username,
        img: newMessage.user.img,
      },
      replyTo: dto.replyTo
        ? {
            id: dto.replyTo.id,
            content: dto.replyTo.content,
            user: dto.replyTo.user,
          }
        : null,
    };

    await this.pusher.trigger(channelName, 'new-message', eventPayload);

    return {
      id: newMessage.id.toString(),
      content: newMessage.content,
      createdAt: newMessage.createdAt.toISOString(),
      user: {
        id: user.id,
        username: newMessage.user.username,
        img: newMessage.user.img,
      },
      replyTo: dto.replyTo || null,
    };
  }

  // ─── DELETE /chat/messages/:id — Xóa tin nhắn ─────────────────────────────
  async deleteMessage(messageId: number, userId: string, classCode: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        userId,
        classCode,
      },
    });

    if (!message) {
      throw new ForbiddenException('Không tìm thấy tin nhắn hoặc không có quyền xóa.');
    }

    await this.prisma.message.delete({
      where: { id: messageId },
    });

    const channelName = `presence-class-${classCode}`;
    await this.pusher.trigger(channelName, 'message-deleted', {
      messageId: messageId.toString(),
      userId,
    });

    return { message: 'Đã xóa tin nhắn thành công.' };
  }

  // ─── POST /chat/messages/:id/recall — Thu hồi tin nhắn ────────────────────
  async recallMessage(messageId: number, userId: string, classCode: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        userId,
        classCode,
      },
    });

    if (!message) {
      throw new ForbiddenException('Không tìm thấy tin nhắn hoặc không có quyền thu hồi.');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { content: '[Tin nhắn đã được thu hồi]' },
    });

    const channelName = `presence-class-${classCode}`;
    await this.pusher.trigger(channelName, 'message-recalled', {
      messageId: messageId.toString(),
      content: updated.content,
      userId,
    });

    return { message: 'Đã thu hồi tin nhắn thành công.', content: updated.content };
  }

  // ─── POST /chat/messages/:id/pin — Ghim tin nhắn ──────────────────────────
  async pinMessage(messageId: number, userId: string, classCode: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        classCode,
      },
    });

    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại.');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        isPinned: true,
        pinnedAt: new Date(),
        pinnedByUserId: userId,
      },
    });

    const channelName = `presence-class-${classCode}`;
    await this.pusher.trigger(channelName, 'message-pinned', {
      messageId: messageId.toString(),
      pinnedAt: updated.pinnedAt?.toISOString(),
      userId,
    });

    return { message: 'Đã ghim tin nhắn thành công.' };
  }

  // ─── POST /chat/messages/:id/unpin — Bỏ ghim tin nhắn ────────────────────
  async unpinMessage(messageId: number, userId: string, classCode: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        classCode,
        isPinned: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Tin nhắn ghim không tồn tại.');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: {
        isPinned: false,
        pinnedAt: null,
        pinnedByUserId: null,
      },
    });

    const channelName = `presence-class-${classCode}`;
    await this.pusher.trigger(channelName, 'message-unpinned', {
      messageId: messageId.toString(),
      userId,
    });

    return { message: 'Đã bỏ ghim tin nhắn thành công.' };
  }

  // ─── GET /chat/class/:classCode/pinned — Lấy tin nhắn đã ghim ─────────────
  async getPinnedMessages(classCode: string) {
    const pinned = await this.prisma.message.findMany({
      where: {
        classCode,
        isPinned: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            img: true,
          },
        },
      },
      orderBy: { pinnedAt: 'desc' },
    });

    return pinned.map((msg) => ({
      id: msg.id.toString(),
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      user: {
        id: msg.user.id,
        username: msg.user.username,
        img: msg.user.img,
      },
      replyTo: msg.replyToId
        ? {
            id: msg.replyToId.toString(),
            content: msg.replyToContent || '',
            user: {
              id: 'unknown',
              username: msg.replyToUsername || 'Unknown',
              img: null,
            },
          }
        : null,
      isPinned: true,
      pinnedAt: msg.pinnedAt?.toISOString(),
      pinnedBy: msg.pinnedByUserId,
    }));
  }
}
