// lib/pusher-server.ts
import PusherServer from "pusher";

// Kiểm tra các biến môi trường
if (!process.env.PUSHER_APP_ID) throw new Error("PUSHER_APP_ID not set");
if (!process.env.PUSHER_KEY) throw new Error("PUSHER_KEY not set");
if (!process.env.PUSHER_SECRET) throw new Error("PUSHER_SECRET not set");
if (!process.env.NEXT_PUBLIC_PUSHER_CLUSTER) throw new Error("NEXT_PUBLIC_PUSHER_CLUSTER not set");

// Validate key khớp với client
if (process.env.PUSHER_KEY !== process.env.NEXT_PUBLIC_PUSHER_KEY) {
  console.warn("[Pusher] Warning: PUSHER_KEY and NEXT_PUBLIC_PUSHER_KEY do not match!");
}

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});