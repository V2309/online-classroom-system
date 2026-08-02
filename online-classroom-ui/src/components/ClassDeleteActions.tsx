"use client";

import { softDeleteClass, restoreClass } from "@/lib/actions/class.action";
import { Trash2, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

interface ClassDeleteActionsProps {
  classId: number;
  isDeleted: boolean;
  className?: string;
}

const ClassDeleteActions = ({ classId, isDeleted, className = "" }: ClassDeleteActionsProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ngăn scroll khi modal mở
  useEffect(() => {
    if (showConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showConfirm]);

  const [deleteState, deleteFormAction] = useFormState(softDeleteClass, {
    success: false,
    error: false,
  });

  const [restoreState, restoreFormAction] = useFormState(restoreClass, {
    success: false,
    error: false,
  });

  useEffect(() => {
    if (deleteState.success) {
      toast.success("Lớp học đã được xóa!");
      setShowConfirm(false);
      router.refresh();
    }
    if (deleteState.error) {
      if (typeof deleteState.error === "string") {
        toast.error(deleteState.error);
      } else {
        toast.error("Có lỗi xảy ra khi xóa lớp học!");
      }
    } 
  }, [deleteState, router]);

  useEffect(() => {
    if (restoreState.success) {
      toast.success("Lớp học đã được khôi phục!");
      router.refresh();
    }
    if (restoreState.error) {
      if (typeof restoreState.error === "string") {
        toast.error(restoreState.error);
      } else {
        toast.error("Có lỗi xảy ra khi khôi phục lớp học!");
      }
    }
  }, [restoreState, router]);

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    const formData = new FormData();
    formData.append("id", classId.toString());
    deleteFormAction(formData);
  };

  const handleRestore = () => {
    const formData = new FormData();
    formData.append("id", classId.toString());
    restoreFormAction(formData);
  };

  if (isDeleted) {
    return (
      <button
        onClick={handleRestore}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors ${className}`}
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
        onClick={handleDeleteClick}
        className={`flex items-center gap-2 text-sm font-medium text-red-700   rounded-lg transition-colors ${className}`}
        title="Xóa lớp học"
      >
        <Trash2 className="h-4 w-4" />
        Xóa
      </button>

      {showConfirm && mounted && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfirm(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-200 scale-100 animate-in fade-in-50 zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Xác nhận xóa lớp học
              </h3>
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
              <p className="text-gray-600 text-center">
                Bạn có chắc chắn muốn xóa lớp học này? 
              </p>
              <p className="text-sm text-gray-500 text-center mt-2">
                Lớp học sẽ được ẩn khỏi danh sách nhưng dữ liệu sẽ được bảo toàn và có thể khôi phục sau.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Xóa lớp học
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