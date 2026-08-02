"use client";

import React, { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Eye, User, Clock, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

// BƯỚC 1: Cập nhật interface ViewerData
interface ViewerData {
  id: string;
  username: string;
  role: string;
  viewedAt: string;
  isStillInClass: boolean; // <-- ĐÃ THÊM CỜ MỚI
}

interface ViewersStats {
  totalViews: number;
  studentViews: number;
  totalStudents: number;
}

interface FileViewersModalProps {
  docId: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

// ... (Giữ nguyên các hàm helpers bên ngoài: formatDate, getRoleColor, getRoleText) ...
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const formatDate = (dateString: string) =>
  dateFormatter.format(new Date(dateString));

const getRoleColor = (role: string) => {
  switch (role) {
    case "student":
      return "bg-blue-100 text-blue-800";
    case "teacher":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getRoleText = (role: string) => {
  switch (role) {
    case "student":
      return "Học sinh";
    case "teacher":
      return "Giáo viên";
    default:
      return role;
  }
};
// ----------------------------------------------


export default function FileViewersModal({
  docId,
  fileName,
  isOpen,
  onClose,
}: FileViewersModalProps) {
  const [viewers, setViewers] = useState<ViewerData[]>([]); // Đã dùng interface mới
  const [stats, setStats] = useState<ViewersStats>({
    totalViews: 0,
    studentViews: 0,
    totalStudents: 0,
  });
  const [loading, setLoading] = useState(false);

  // ... (Giữ nguyên useCallback fetchViewers và useEffect) ...
  const fetchViewers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/files/${docId}/view`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch viewers");
      }

      const data = await response.json();
      setViewers(data.viewers || []);
      setStats(
        data.stats || { totalViews: 0, studentViews: 0, totalStudents: 0 }
      );
    } catch (error) {
      console.error("Error fetching viewers:", error);
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi tải danh sách người xem"
      );
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    if (isOpen) {
      fetchViewers();
    }
  }, [isOpen, fetchViewers]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50  max-h-[80vh] w-full max-w-2xl translate-x-[-50%] translate-y-[-50%]  border bg-white shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg flex flex-col">
          
          {/* ... (Giữ nguyên Header) ... */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
            <div>
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Danh sách người xem
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 mt-1 truncate">
                {fileName}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </Dialog.Close>
          </div>
          
          {/* ... (Giữ nguyên Stats) ... */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 shrink-0">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.studentViews}
                </div>
                <div className="text-xs text-gray-600">Học sinh đã xem</div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-gray-800">
                  {stats.totalStudents}
                </div>
                <div className="text-xs text-gray-600">Tổng học sinh</div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {(stats => {
                    const percentage = stats.totalStudents > 0
                      ? Math.round((stats.studentViews / stats.totalStudents) * 100)
                      : 0;
                    return Math.min(percentage, 100); 
                  })(stats)}%
                </div>
                <div className="text-xs text-gray-600">Tỷ lệ xem</div>
              </div>
            </div>
          </div>

          {/* Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto">
                  <div className="p-6">
                       {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : viewers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Chưa có ai xem tài liệu này</p>
              </div>
            ) : (
              <div className="space-y-3">
                
                {/* BƯỚC 2: Cập nhật logic render */}
                {viewers.map((viewer) => (
                  <div
                    key={viewer.id}
                    className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ${
                      // Làm mờ nếu đã rời lớp
                      !viewer.isStillInClass ? "opacity-60" : "" 
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {viewer.username}
                          {/* Thêm tag (Đã rời lớp) */}
                          {!viewer.isStillInClass && (
                            <span className="ml-2 text-xs font-normal text-red-600">
                              (Đã rời lớp)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${getRoleColor(
                              viewer.role
                            )}`}
                          >
                            {getRoleText(viewer.role)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDate(viewer.viewedAt)}
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            )}
                  </div>
          </div>

          {/* ... (Giữ nguyên Footer) ... */}
          <div className="p-6 border-t border-gray-200 shrink-0">
            <Dialog.Close asChild>
              <button className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors">
                Đóng
              </button>
            </Dialog.Close>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}