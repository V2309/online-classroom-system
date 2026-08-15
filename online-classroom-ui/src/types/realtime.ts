export interface StreamTokenResponse {
  token: string;
  apiKey: string;
  userId: string;
  name: string;
}

export interface PusherAuthPayload {
  socket_id: string;
  channel_name?: string;
}
