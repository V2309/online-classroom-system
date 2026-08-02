"use client";

import { useState } from "react";
import { leaveClassAction } from "@/lib/actions/class.action";
import { toast } from "react-toastify";

interface LeaveClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classData: {
    id: number;
    name: string;
    class_code: string | null;
  };
  onSuccess?: () => void;
}

const LeaveClassDialog = ({
  isOpen,
  onClose,
  classData,
  onSuccess
}: LeaveClassDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLeaveClass = async () => {
    setIsLoading(true);
    
    try {
      const result = await leaveClassAction(classData.id);
      
      if (result.success) {
        toast.success(result.message || "Rời lớp thành công!");
        onClose();
        onSuccess?.();
      } else {
        toast.error(result.error || "Có lỗi xảy ra khi rời lớp");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi rời lớp");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Xác nhận rời lớp
              </h3>
              <p className="text-sm text-gray-600">
                Hành động này không thể hoàn tác
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              Bạn có chắc chắn muốn rời khỏi lớp học này không?
            </p>
   
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h5 className="font-medium text-amber-800 mb-1">Lưu ý quan trọng:</h5>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Bạn sẽ mất quyền truy cập vào tài liệu lớp học</li>
                  <li>• Các bài tập và điểm số sẽ không còn hiển thị</li>
                  <li>• Để tham gia lại, bạn cần mã lớp từ giáo viên</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleLeaveClass}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang rời lớp...
              </>
            ) : (
              "Rời lớp học"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveClassDialog;