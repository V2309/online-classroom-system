import { api } from '@/lib/api';
import { StreamTokenResponse } from '@/types/realtime';

export const realtimeService = {
  // ─── Lấy token GetStream Video ───────────────────────────────────────────
  async getStreamToken(): Promise<StreamTokenResponse> {
    const response = await api.get<StreamTokenResponse>('/realtime/stream/token');
    return response.data;
  },

  // ─── Xác thực Pusher channel / user ──────────────────────────────────────
  async authenticatePusher(payload: { socket_id: string; channel_name?: string }) {
    const response = await api.post('/realtime/pusher/auth', payload);
    return response.data;
  },
};
