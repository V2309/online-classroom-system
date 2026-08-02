// lib/pusher-client.ts
"use client";

import PusherClient from "pusher-js";

// Kiểm tra các biến môi trường
if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
  throw new Error("NEXT_PUBLIC_PUSHER_KEY not set");
}
if (!process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
  throw new Error("NEXT_PUBLIC_PUSHER_CLUSTER not set");
}

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    // Cấu hình cho Private channels
    authEndpoint: "/api/pusher/auth",
    authTransport: "ajax",
    // Cấu hình cho Presence channels (User Authentication)
    userAuthentication: {
      endpoint: "/api/pusher/auth",
      transport: "ajax",
    },
    // Connection optimization
    activityTimeout: 30000, // 30 seconds
    pongTimeout: 6000, // 6 seconds
    unavailableTimeout: 16000, // 16 seconds
    // Reduce connection overhead
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
  }
);