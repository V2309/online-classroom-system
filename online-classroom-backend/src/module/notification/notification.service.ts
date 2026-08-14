import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách thông báo của user hiện tại
   */
  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            img: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });
  }

  /**
   * Đánh dấu tất cả thông báo của user là đã đọc
   */
  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  }

  /**
   * Đánh dấu 1 thông báo là đã đọc
   */
  async markAsRead(userId: string, notificationId: number) {
    await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientId: userId,
      },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  }
}
