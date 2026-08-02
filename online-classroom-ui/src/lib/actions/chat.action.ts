// lib/actions/chat.action.ts
"use server";

import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher-server";
import { getCurrentUser } from "@/lib/auth";

interface SendMessagePayload {
  content: string;
  classCode: string;
  replyTo?: {
    id: string;
    content: string;
    user: {
      id: string;
      username: string;
      img: string | null;
    };
  };
}

interface DeleteMessagePayload {
  messageId: string;
  classCode: string;
}

interface RecallMessagePayload {
  messageId: string;
  classCode: string;
}

interface PinMessagePayload {
  messageId: string;
  classCode: string;
}

interface UnpinMessagePayload {
  messageId: string;
  classCode: string;
}

interface PinMessagePayload {
  messageId: string;
  classCode: string;
}

interface UnpinMessagePayload {
  messageId: string;
  classCode: string;
}

export async function sendMessage(payload: SendMessagePayload) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { content, classCode, replyTo } = payload;
  if (!content || !classCode) {
    return { success: false, error: "Missing content or class code" };
  }

  try {
    // 1. Lưu tin nhắn vào Database
    const newMessage = await prisma.message.create({
      data: {
        content: content,
        classCode: classCode,
        userId: user.id as string,
        replyToId: replyTo?.id ? parseInt(replyTo.id) : null,
        replyToContent: replyTo?.content || null,
        replyToUsername: replyTo?.user.username || null,
      },
      include: {
        user: { // Lấy thông tin người gửi để bắn đi
          select: { username: true, img: true }
        }
      }
    });

    // 2. "Bắn" (trigger) sự kiện Pusher
    // Tên kênh (ví dụ: 'presence-class-WIBEZ')
    const channelName = `presence-class-${classCode}`;
    const eventName = "new-message";

    // Data gửi đi (phải chứa cả thông tin user và reply)
    const eventPayload = {
      id: newMessage.id.toString(),
      content: newMessage.content,
      createdAt: newMessage.createdAt.toISOString(),
      user: {
        id: user.id,
        username: newMessage.user.username,
        img: newMessage.user.img,
      },
      replyTo: replyTo ? {
        id: replyTo.id,
        content: replyTo.content,
        user: replyTo.user
      } : null
    };

    await pusherServer.trigger(channelName, eventName, eventPayload);

    return { success: true, data: newMessage };

  } catch (error) {
    console.error("Send message error:", error);
    return { success: false, error: "Internal server error" };
  }
}

// Xóa tin nhắn (chỉ ở phía người gửi)
export async function deleteMessage(messageId: string, classCode: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // Kiểm tra tin nhắn có thuộc về user này không
    const message = await prisma.message.findFirst({
      where: {
        id: parseInt(messageId),
        userId: user.id as string,
        classCode: classCode
      }
    });

    if (!message) {
      return { success: false, error: "Message not found or unauthorized" };
    }

    // Xóa tin nhắn khỏi database
    await prisma.message.delete({
      where: { id: parseInt(messageId) }
    });

    // Thông báo qua Pusher
    const channelName = `presence-class-${classCode}`;
    await pusherServer.trigger(channelName, "message-deleted", {
      messageId: messageId,
      userId: user.id
    });

    return { success: true };
  } catch (error) {
    console.error("Delete message error:", error);
    return { success: false, error: "Internal server error" };
  }
}

// Thu hồi tin nhắn (xóa cho tất cả mọi người)
export async function recallMessage(messageId: string, classCode: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // Kiểm tra tin nhắn có thuộc về user này không
    const message = await prisma.message.findFirst({
      where: {
        id: parseInt(messageId),
        userId: user.id as string,
        classCode: classCode
      }
    });

    if (!message) {
      return { success: false, error: "Message not found or unauthorized" };
    }

    // Cập nhật tin nhắn thành "recalled"
    const updatedMessage = await prisma.message.update({
      where: { id: parseInt(messageId) },
      data: { content: "[Tin nhắn đã được thu hồi]" }
    });

    // Thông báo qua Pusher
    const channelName = `presence-class-${classCode}`;
    await pusherServer.trigger(channelName, "message-recalled", {
      messageId: messageId,
      content: updatedMessage.content,
      userId: user.id
    });

    return { success: true };
  } catch (error) {
    console.error("Recall message error:", error);
    return { success: false, error: "Internal server error" };
  }
}

// Ghim tin nhắn
export async function pinMessage(messageId: string, classCode: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // Kiểm tra tin nhắn có tồn tại không
    const message = await prisma.message.findFirst({
      where: {
        id: parseInt(messageId),
        classCode: classCode
      },
      include: {
        user: { select: { username: true, img: true } }
      }
    });

    if (!message) {
      return { success: false, error: "Message not found" };
    }

    // Cập nhật trạng thái ghim
    const updatedMessage = await prisma.message.update({
      where: { id: parseInt(messageId) },
      data: {
        isPinned: true,
        pinnedAt: new Date(),
        pinnedByUserId: user.id as string
      }
    });

    // Thông báo qua Pusher
    const channelName = `presence-class-${classCode}`;
    await pusherServer.trigger(channelName, "message-pinned", {
      messageId: messageId,
      pinnedAt: updatedMessage.pinnedAt?.toISOString(),
      userId: user.id
    });

    return { success: true };
  } catch (error) {
    console.error("Pin message error:", error);
    return { success: false, error: "Internal server error" };
  }
}

// Bỏ ghim tin nhắn
export async function unpinMessage(messageId: string, classCode: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // Kiểm tra tin nhắn có tồn tại không
    const message = await prisma.message.findFirst({
      where: {
        id: parseInt(messageId),
        classCode: classCode,
        isPinned: true
      }
    });

    if (!message) {
      return { success: false, error: "Pinned message not found" };
    }

    // Cập nhật trạng thái bỏ ghim
    await prisma.message.update({
      where: { id: parseInt(messageId) },
      data: {
        isPinned: false,
        pinnedAt: null,
        pinnedByUserId: null
      }
    });

    // Thông báo qua Pusher
    const channelName = `presence-class-${classCode}`;
    await pusherServer.trigger(channelName, "message-unpinned", {
      messageId: messageId,
      userId: user.id
    });

    return { success: true };
  } catch (error) {
    console.error("Unpin message error:", error);
    return { success: false, error: "Internal server error" };
  }
}

// Lấy danh sách tin nhắn đã ghim
export async function getPinnedMessages(classCode: string) {
  try {
    const pinnedMessages = await prisma.message.findMany({
      where: {
        classCode: classCode,
        isPinned: true
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            img: true
          }
        }
      },
      orderBy: { pinnedAt: 'desc' }
    });

    return {
      success: true,
      data: pinnedMessages.map(msg => ({
        id: msg.id.toString(),
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        user: {
          id: msg.user.id,
          username: msg.user.username,
          img: msg.user.img
        },
        replyTo: msg.replyToId ? {
          id: msg.replyToId.toString(),
          content: msg.replyToContent || '',
          user: {
            id: 'unknown',
            username: msg.replyToUsername || 'Unknown',
            img: null
          }
        } : null,
        isPinned: true,
        pinnedAt: msg.pinnedAt?.toISOString(),
        pinnedBy: msg.pinnedByUserId
      }))
    };
  } catch (error) {
    console.error("Get pinned messages error:", error);
    return { success: false, error: "Internal server error" };
  }
}