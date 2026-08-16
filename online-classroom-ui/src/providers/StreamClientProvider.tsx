'use client';

import { ReactNode, useEffect, useState } from 'react';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';
import { useUser } from '@/hooks/useUser';
import { realtimeService } from '@/services/realtime.service';
import Loader from '@/components/Loader';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const tokenProvider = async (): Promise<string> => {
  const data = await realtimeService.getStreamToken();
  return data.token;
};

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading || !user) return;
    if (!API_KEY) throw new Error('Stream API key is missing');

    const client = new StreamVideoClient({
      apiKey: API_KEY,
      user: {
        id: user?.id,
        name: user?.username || user?.id,
        image: user?.img 
          ? `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}${user.img}`
          : undefined,
      },
      tokenProvider,
    });

    setVideoClient(client);
  }, [user, loading]);

  if (!videoClient) return <Loader />;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
