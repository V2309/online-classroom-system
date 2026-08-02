// components/Notification.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher-client"; // Import Pusher
import { useUser } from "@/hooks/useUser"; // Import useUser

// 1. Cập nhật Type để khớp với Model Prisma
type NotificationType = {
  id: string;
  actor: {
    username: string;
  };
  type: "POST_LIKE" | "POST_COMMENT" | "NEW_POST" | "SUBMISSION_GRADED" | string; // Mở rộng type
  link: string;
  createdAt: string; // Thêm createdAt
};

const Notification = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  // 2. Hàm Fetch thông báo từ DB
  const fetchNotifications = useCallback(async () => {
    if (!user) return; // Chỉ fetch khi có user
    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 3. useEffect để fetch lần đầu và lắng nghe Pusher
  useEffect(() => {
    if (user) {
      // 3.1. Fetch data đã lưu
      fetchNotifications();

      // 3.2. Lắng nghe Pusher để CẬP NHẬT TRỰC TIẾP
      const channelName = `private-user-${user.id}`;
      try {
        const channel = pusherClient.subscribe(channelName);
        
        channel.bind("new-notification", (data: any) => {
       
          // Khi có thông báo mới, fetch lại danh sách
          // (Hoặc bạn có thể thêm trực tiếp vào state)
          fetchNotifications();
        });

        return () => {
          pusherClient.unsubscribe(channelName);
        };
      } catch (error) {
        console.error("Pusher subscription error:", error);
      }
    }
  }, [user, fetchNotifications]);

  // 4. Hàm "Mark as read"
  const reset = async () => {
    if (notifications.length === 0) {
      setOpen(false);
      return;
    }
    
    // Cập nhật UI ngay lập tức
    setNotifications([]);
    setOpen(false);
    
    // Gọi API để cập nhật database
    try {
      await fetch("/api/notifications", { method: "POST" });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // 5. Hàm Click vào 1 thông báo
  const handleClick = (notification: NotificationType) => {
    // (Logic này có thể thay đổi, ví dụ: gọi API đánh dấu 1 item là đã đọc)
    const filteredList = notifications.filter((n) => n.id !== notification.id);
    setNotifications(filteredList);
    setOpen(false);
    router.push(notification.link);
  };

  // 6. Hàm hiển thị text
  const getNotificationText = (type: string) => {
    switch (type) {
      case "POST_LIKE": return "đã thích bài đăng của bạn";
      case "POST_COMMENT": return "đã bình luận về bài đăng của bạn";
      case "NEW_POST": return "đã đăng một bài mới trong lớp";
      case "SUBMISSION_GRADED": return "đã chấm điểm bài tập của bạn";
      case "STUDENT_JOINED_CLASS": return "đã tham gia lớp học của bạn";
      case "CLASS_APPROVAL": return "đã gửi yêu cầu tham gia lớp của bạn";
      default: return "đã gửi cho bạn một thông báo";
    }
  };

  return (
    <div className="relative mb-4 ">
      <div
        className="cursor-pointer p-2 rounded-full hover:bg-[gray] flex items-center gap-4"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="relative">
          <Image src="/noti.png" alt="" width={24} height={24} />
          {notifications.length > 0 && (
            <div className="absolute -top-4 -right-4 w-6 h-6 bg-iconBlue p-2 rounded-full flex items-center justify-center text-sm">
              {notifications.length}
            </div>
          )}
        </div>
      </div>
      {open && (
        <div className="absolute z-50 -right-full p-4 rounded-lg bg-gray-100 text-black flex flex-col gap-4 min-w-[300px] max-h-96 overflow-y-auto">
          <h1 className="text-xl text-textGray">Thông báo</h1>
          {isLoading ? (
            <div className="text-center text-sm text-gray-500">Đang tải...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-sm text-gray-500">Không có thông báo mới.</div>
          ) : (
            notifications.map((n) => (
              <div
                className="cursor-pointer hover:bg-gray-200 p-2 rounded"
                key={n.id}
                onClick={() => handleClick(n)}
              >
                <b>{n.actor.username}</b>{" "}
                {getNotificationText(n.type)}
              </div>
            ))
          )}
          <button
            onClick={reset}
            className="bg-black text-white p-2 text-sm rounded-lg mt-2  bottom-0"
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      )}
    </div>
  );
};

export default Notification;