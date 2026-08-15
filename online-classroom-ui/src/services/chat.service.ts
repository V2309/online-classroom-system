import { api } from '@/lib/api';
import {
  ChatGroupMessage,
  InitialChatDataResponse,
  SendMessageRequest,
} from '@/types/chat';

export const chatService = {
  // ─── Lấy dữ liệu chat ban đầu (messages + members) ───────────────────────
  async getInitialChatData(classCode: string): Promise<InitialChatDataResponse> {
    const response = await api.get<InitialChatDataResponse>(
      `/chat/class/${classCode}/initial`
    );
    return response.data;
  },

  // ─── Lấy danh sách tin nhắn ghim ─────────────────────────────────────────
  async getPinnedMessages(classCode: string): Promise<ChatGroupMessage[]> {
    const response = await api.get<ChatGroupMessage[]>(
      `/chat/class/${classCode}/pinned`
    );
    return response.data;
  },

  // ─── Gửi tin nhắn mới ────────────────────────────────────────────────────
  async sendMessage(data: SendMessageRequest): Promise<{ success: boolean; data: any }> {
    const response = await api.post('/chat/messages', data);
    return { success: true, data: response.data };
  },

  // ─── Xóa tin nhắn ────────────────────────────────────────────────────────
  async deleteMessage(
    messageId: string,
    classCode: string
  ): Promise<{ success: boolean }> {
    await api.delete(`/chat/messages/${messageId}`, {
      params: { classCode },
    });
    return { success: true };
  },

  // ─── Thu hồi tin nhắn ────────────────────────────────────────────────────
  async recallMessage(
    messageId: string,
    classCode: string
  ): Promise<{ success: boolean }> {
    await api.post(`/chat/messages/${messageId}/recall`, { classCode });
    return { success: true };
  },

  // ─── Ghim tin nhắn ───────────────────────────────────────────────────────
  async pinMessage(
    messageId: string,
    classCode: string
  ): Promise<{ success: boolean }> {
    await api.post(`/chat/messages/${messageId}/pin`, { classCode });
    return { success: true };
  },

  // ─── Bỏ ghim tin nhắn ────────────────────────────────────────────────────
  async unpinMessage(
    messageId: string,
    classCode: string
  ): Promise<{ success: boolean }> {
    await api.post(`/chat/messages/${messageId}/unpin`, { classCode });
    return { success: true };
  },
};
