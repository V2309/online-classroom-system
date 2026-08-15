import { api } from '@/lib/api';
import type { NotificationItem } from '@/types/notification';

export type { NotificationItem };

export const notificationService = {
  // Lấy danh sách thông báo chưa đọc
  async getNotifications(): Promise<NotificationItem[]> {
    const response = await api.get<NotificationItem[]>('/notifications');
    return response.data;
  },

  // Đánh dấu tất cả thông báo là đã đọc
  async markAllAsRead(): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>('/notifications');
    return response.data;
  },

  // Đánh dấu 1 thông báo là đã đọc
  async markAsRead(id: number): Promise<{ success: boolean }> {
    const response = await api.patch<{ success: boolean }>(`/notifications/${id}/read`);
    return response.data;
  },
};
