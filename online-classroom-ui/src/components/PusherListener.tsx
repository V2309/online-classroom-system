// components/PusherListener.tsx
"use client";

import { useEffect } from "react";
// BƯỚC 1: Import thêm 'type Channel'
import { type Channel } from "pusher-js"; 
import { useUser } from "@/hooks/useUser"; // Import hook lấy user của bạn
import { pusherClient } from "@/lib/pusher-client"; // Import client Pusher (từ Bước 3)
import { toast } from "react-toastify"; // Import toast

// (Interface này để gõ nhanh, bạn có thể Tùy chỉnh)
interface NotificationData {
  message: string;
  link?: string;
  // Bất cứ data gì bạn gửi từ server (Bước 6)
}

export default function PusherListener() {
  // Lấy user từ context (giống như trong Socket.tsx cũ)
  const { user } = useUser();

  useEffect(() => {
    // 1. Chỉ chạy khi đã có user
    if (!user) return;

    // 2. Tên kênh phải là duy nhất cho mỗi user.
    const channelName = `private-user-${user.id}`;
    console.log("User online", user.username, "subscribing to channel:", channelName);
    // BƯỚC 2: Gán kiểu 'Channel' cho biến
    let channel: Channel | undefined;

    try {
      // 3. Đăng ký (subscribe) kênh riêng tư
      channel = pusherClient.subscribe(channelName);

      // 4. Lắng nghe (bind) sự kiện "new-notification"
      channel.bind(
        "new-notification",
        (data: NotificationData) => {
          // 5. HIỂN THỊ THÔNG BÁO
          console.log("Pusher received:", data);
          toast.info(data.message || "Bạn có thông báo mới!");
        }
      );

    } catch (error) {
      console.error("Failed to subscribe to Pusher channel:", channelName, error);
    }

    // 6. Dọn dẹp: Hủy đăng ký khi component unmount
    return () => {
      if (channel) {
        // Hủy đăng ký kênh cụ thể
        pusherClient.unsubscribe(channelName);
      }
    };
    
  }, [user]); // Chạy lại khi 'user' thay đổi (login/logout)

  return null; // Component này không render gì ra màn hình
}