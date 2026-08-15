'use server';

import { serverFetch } from '@/lib/server-api';
import { StreamTokenResponse } from '@/types/realtime';

export const tokenProvider = async (): Promise<string> => {
  try {
    const data = await serverFetch<StreamTokenResponse>('/realtime/stream/token');
    return data.token;
  } catch (error) {
    console.error('Error fetching stream token:', error);
    throw new Error('Failed to generate stream token');
  }
};
