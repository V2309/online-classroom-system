import { api } from '@/lib/api';
import type { UserProfile, UpdateProfileRequest } from '@/types/auth';

export const userService = {
  // Lấy thông tin profile
  async getProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/users/me');
    return response.data;
  },

  // Cập nhật profile
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await api.patch<UserProfile>('/users/profile', data);
    return response.data;
  },

  // Đổi mật khẩu
  async changePassword(newPassword: string, confirmPassword: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/users/change-password', {
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  // Lấy danh sách giáo viên
  async getTeachers(): Promise<{ id: string; username: string }[]> {
    const response = await api.get<{ id: string; username: string }[]>('/users/teachers');
    return response.data;
  },
};
