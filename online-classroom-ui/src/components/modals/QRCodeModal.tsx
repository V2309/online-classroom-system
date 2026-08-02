"use client";

import React from 'react';
import QRCode from 'react-qr-code';
import { X } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: string;
  className?: string;
  code?: string | null;
}

export default function QRCodeModal({ isOpen, onClose, link, className, code }: QRCodeModalProps) {
  if (!isOpen) return null;

  return (
    // Lớp nền mờ
    <div className="fixed inset-0 z-50 flex items-center justify-center  backdrop-blur-sm p-4">
      
      {/* Nội dung Modal */}
      <div className="z-50 bg-white rounded-2xl shadow-xl w-full max-w-sm mx-auto transform animate-in fade-in zoom-in-95 duration-300 ">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Mã QR tham gia lớp
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Thân Modal - Chứa mã QR */}
        <div className="p-8 flex flex-col items-center justify-center">
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            {/* Component QR Code */}
            <QRCode value={link} size={256} />
          </div>

          <p className="mt-4 text-sm text-gray-600">Mã lớp:</p>
          <p className="text-2xl font-bold text-gray-800 tracking-widest">{code}</p>

          <p className="mt-4 text-xs text-gray-500 text-center">
            Học sinh có thể dùng camera điện thoại để quét mã này và tham gia lớp học.
          </p>
        </div>
        
        {/* Footer Modal */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
