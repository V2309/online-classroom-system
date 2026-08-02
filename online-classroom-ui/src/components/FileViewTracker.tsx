"use client";

import { useEffect } from "react";

interface FileViewTrackerProps {
  docId: string;
  userId: string;
  classCode: string;
}

export default function FileViewTracker({ docId, userId, classCode }: FileViewTrackerProps) {
  useEffect(() => {
    const recordView = async () => {
      // Tạo key unique cho combination user + file
      const storageKey = `file_viewed_${userId}_${docId}`;

      // Kiểm tra localStorage xem đã ghi nhận lượt xem chưa
      const hasViewed = localStorage.getItem(storageKey);
      if (hasViewed) {
        return; // Đã xem rồi, không cần ghi nhận nữa
      }

      try {
        const response = await fetch(`/api/files/${docId}/view`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
          }),
        });

        if (response.ok) {
          // Lưu vào localStorage để tránh ghi nhận lại
          localStorage.setItem(storageKey, new Date().toISOString());
        }
      } catch (error) {
        console.error("Error recording file view:", error);
      }
    };

    // Ghi nhận lượt xem khi component mount
    recordView();
  }, [docId, userId]); // Chỉ chạy khi docId hoặc userId thay đổi

  return null; // Component này không render gì
}