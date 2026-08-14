"use client";

import { classService } from "@/services/class.service";
import { Trash2, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

interface ClassDeleteActionsProps {
  classId: number;
  isDeleted: boolean;
  className?: string;
}

const ClassDeleteActions = ({ classId, isDeleted, className = "" }: ClassDeleteActionsProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showConfirm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showConfirm]);

  const handleRestore = async () => {
    setLoading(true);
    try {
      await classService.restoreClass(classId);
      router.refresh();
    } catch (err: any) {
      alert(err.response?.data?.message || "Có lỗi xảy ra khi khôi phục lớp học!");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      await classService.deleteClass(classId);
      setShowConfirm(false);
      router.refresh();
    } catch (err: any) {
      alert(err.response?.data?.message || "Có lỗi xảy ra khi xóa lớp học!");
    } finally {
      setLoading(false);
    }
  };

  if (isDeleted) {
    return (
      <button
        onClick={handleRestore}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50 ${className}`}
        title="Khôi phục lớp học"
      >
        <RotateCcw className="h-4 w-4" />
        Khôi phục
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className={`flex items-center gap-2 text-sm font-medium text-red-700 rounded-lg transition-colors ${className}`}
        title="Xóa lớp học"
      >
        <Trash2 className="h-4 w-4" />
        Xóa
      </button>

      {showConfirm && mounted && createPortal(
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false); }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Xác nhận xóa lớp học</h3>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-center mb-3">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-gray-600 text-center">Bạn có chắc chắn muốn xóa lớp học này?</p>
              <p className="text-sm text-gray-500 text-center mt-2">
                Lớp học sẽ được ẩn khỏi danh sách nhưng dữ liệu sẽ được bảo toàn và có thể khôi phục sau.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "Đang xóa..." : "Xóa lớp học"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ClassDeleteActions;