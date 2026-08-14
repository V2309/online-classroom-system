"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher-client";
import { useUser } from "@/hooks/useUser";
import { notificationService, NotificationItem } from "@/services/notification.service";

const Notification = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  // Fetch thông báo từ NestJS
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      const channelName = `private-user-${user.id}`;
      try {
        const channel = pusherClient.subscribe(channelName);
        channel.bind("new-notification", () => {
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

  // Mark all as read
  const reset = async () => {
    if (notifications.length === 0) {
      setOpen(false);
      return;
    }

    setNotifications([]);
    setOpen(false);

    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Click vào 1 thông báo
  const handleClick = async (notification: NotificationItem) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    setOpen(false);

    try {
      await notificationService.markAsRead(notification.id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getNotificationText = (type: string) => {
    switch (type) {
      case "POST_LIKE":
        return "đã thích bài đăng của bạn";
      case "POST_COMMENT":
        return "đã bình luận về bài đăng của bạn";
      case "NEW_POST":
        return "đã đăng một bài mới trong lớp";
      case "SUBMISSION_GRADED":
        return "đã chấm điểm bài tập của bạn";
      case "STUDENT_JOINED_CLASS":
        return "đã tham gia lớp học của bạn";
      case "CLASS_APPROVAL":
        return "đã gửi yêu cầu tham gia lớp của bạn";
      case "NEW_HOMEWORK":
        return "đã giao một bài tập mới";
      default:
        return "đã gửi cho bạn một thông báo";
    }
  };

  return (
    <div className="relative mb-4">
      <div
        className="cursor-pointer p-2 rounded-full hover:bg-[gray] flex items-center gap-4"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="relative">
          <Image src="/noti.png" alt="Notifications" width={24} height={24} />
          {notifications.length > 0 && (
            <div className="absolute -top-4 -right-4 w-6 h-6 bg-iconBlue p-2 rounded-full flex items-center justify-center text-sm">
              {notifications.length}
            </div>
          )}
        </div>
      </div>
      {open && (
        <div className="absolute z-50 -right-full p-4 rounded-lg bg-gray-100 text-black flex flex-col gap-4 min-w-[300px] max-h-96 overflow-y-auto shadow-lg border border-gray-200">
          <h1 className="text-xl text-textGray font-semibold">Thông báo</h1>
          {isLoading ? (
            <div className="text-center text-sm text-gray-500">Đang tải...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-sm text-gray-500">Không có thông báo mới.</div>
          ) : (
            notifications.map((n) => (
              <div
                className="cursor-pointer hover:bg-gray-200 p-2 rounded transition-colors"
                key={n.id}
                onClick={() => handleClick(n)}
              >
                <b>{n.actor?.username || "Một người dùng"}</b> {getNotificationText(n.type)}
              </div>
            ))
          )}
          <button
            onClick={reset}
            className="bg-black text-white p-2 text-sm rounded-lg mt-2 hover:bg-gray-800 transition-colors"
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      )}
    </div>
  );
};

export default Notification;