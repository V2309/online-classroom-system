import { api } from '@/lib/api';

export const whiteboardService = {
  // Lấy dữ liệu bảng trắng của lớp
  async getWhiteboardState(classCode: string): Promise<any> {
    const response = await api.get<any>(`/whiteboard/${classCode}`);
    return response.data;
  },

  // Lưu/cập nhật dữ liệu bảng trắng của lớp
  async saveWhiteboardState(classCode: string, content: any): Promise<{ success: boolean }> {
    const response = await api.put<{ success: boolean }>(`/whiteboard/${classCode}`, { content });
    return response.data;
  },
};
