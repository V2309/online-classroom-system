import { api } from '@/lib/api';

export const userService = {
  // Lấy thông tin profile người dùng hiện tại
  async getProfile(token?: string) {
    const response = await api.get('/users/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data; // Trả về dạng { statusCode, message, data }
  },
};
