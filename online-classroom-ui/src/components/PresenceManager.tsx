// components/PresenceManager.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { globalPresenceManager } from "@/lib/presence-manager";

// Component để giữ user online trong tất cả các lớp mà user tham gia
export default function PresenceManager() {
  const { user } = useUser();
  const [classCodes, setClassCodes] = useState<string[]>([]);

  // Lấy danh sách class codes mà user tham gia
  useEffect(() => {
    if (!user) {
      setClassCodes([]);
      return;
    }

    const fetchUserClasses = async () => {
      try {
        const response = await fetch("/api/user/classes");
        if (response.ok) {
          const data = await response.json();
          // Lấy class_code từ mỗi class
          const codes = data
            .map((cls: any) => cls.class_code)
            .filter((code: string | null) => code !== null) as string[];
          setClassCodes(codes);
        }
      } catch (error) {
        console.error("[PresenceManager] Error fetching classes:", error);
      }
    };

    fetchUserClasses();
  }, [user]);

  // Subscribe vào tất cả presence channels
  useEffect(() => {
    if (!user || classCodes.length === 0) return;

    const subscribeToAllClasses = async () => {
      try {
        // Subscribe vào tất cả presence channels
        for (const classCode of classCodes) {
          await globalPresenceManager.subscribeToClass(classCode);
        }
      } catch (error) {
        console.error("[PresenceManager] Error subscribing to classes:", error);
      }
    };

    subscribeToAllClasses();

    // Cleanup khi component unmount - không unsubscribe để giữ online status
    return () => {
      // Không làm gì để giữ user online
    };
  }, [user, classCodes]);

  // Cleanup khi user logout
  useEffect(() => {
    if (!user) {
      globalPresenceManager.unsubscribeAll();
    }
  }, [user]);

  // Cleanup khi user đóng browser/tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Chỉ cleanup nếu thực sự đóng browser, không phải navigate
      globalPresenceManager.unsubscribeAll();
    };

    const handleVisibilityChange = () => {
      // Khi user quay lại tab, refresh presence data
      if (!document.hidden && user && classCodes.length > 0) {
        console.log('[PresenceManager] Tab became visible, refreshing presence...');
        // Đợi một chút để Pusher reconnect
        setTimeout(() => {
          classCodes.forEach(async (classCode) => {
            await globalPresenceManager.subscribeToClass(classCode);
          });
        }, 1000);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, classCodes]);

  return null; // Component này không render gì
}




