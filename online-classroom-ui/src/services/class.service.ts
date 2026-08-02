import { api } from '@/lib/api';

export const classService = {
  // Lấy danh sách lớp học
  async getClasses(
    params: { page?: string; type?: string; search?: string },
    token?: string,
  ) {
    const response = await api.get('/classes', {
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data;
  },
};
