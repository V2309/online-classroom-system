"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react'; // Sử dụng icon Lucide cho sạch sẽ

interface ApprovalModalProps {
  onClose: () => void;
  redirectPath?: string;
}

export default function ApprovalModal({ onClose, redirectPath = '/class' }: ApprovalModalProps) {
  const router = useRouter();

  const handleClose = () => {
    onClose();
    router.push(redirectPath);
    router.refresh(); // Đảm bảo dữ liệu được làm mới
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 transform animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center">
          
          {/* Icon (Đã làm sạch UI) */}
          <div className="relative w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" strokeWidth={2.5} />
            {/* Hiệu ứng ping */}
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-green-500 opacity-20 animate-ping"></div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Yêu cầu đã được gửi
          </h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Yêu cầu tham gia lớp của bạn đã được gửi đến giáo viên, chờ phê duyệt để vào lớp.
          </p>
          
          <button
            onClick={handleClose}
            className="w-full bg-blue-600 text-white py-3.5 px-4 rounded-lg font-semibold text-base hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/30"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
