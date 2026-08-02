"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinClassAction } from "@/lib/actions/class.action";
// Đảm bảo đường dẫn import type là chính xác
import type { ClassInfoPayload } from '@/app/(fullpage)/join/[classCode]/page'; 
import { toast } from 'react-toastify';
import Image from 'next/image';
import { ArrowRight, Check, AlertTriangle, UserCircle } from 'lucide-react';
import ApprovalModal from '@/components/modals/ApprovalModal'; // Import modal chung

interface JoinClassConfirmProps {
  classInfo: ClassInfoPayload;
  isAlreadyJoined: boolean;
}

export default function JoinClassConfirm({ classInfo, isAlreadyJoined }: JoinClassConfirmProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 1. Thêm state để quản lý modal
  const [showApprovalModal, setShowApprovalModal] = useState(false); 

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await joinClassAction(classInfo.class_code as string);
      
      if (result.success) {
        if (result.message) {
          // 2. SỬA LOGIC: Thay vì toast, hiển thị modal
          setShowApprovalModal(true);
        } else {
          // Tham gia thành công
          toast.success("Tham gia lớp thành công!");
          router.push('/class'); // Chuyển về trang danh sách lớp
          router.refresh();
        }
      } else {
        // Lỗi từ server (ví dụ: Lớp đầy, Lỗi DB)
        setError(result.error || "Có lỗi xảy ra.");
      }
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 3. Bọc JSX trong <React.Fragment> (hoặc <>) để chứa modal
    <>
      <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4">
        {/* Logo (Hiển thị bên trái trên desktop) */}
        <div className="hidden lg:flex flex-col items-center justify-center w-1/2 text-white">
          {/* Bạn có thể thay thế SVG này bằng logo của mình */}
          <svg className="w-24 h-24 mb-4" fill="none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="100" fill="white"/>
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="90" fontWeight="bold" fill="#2563EB">D</text>
          </svg>
          <h1 className="text-4xl font-bold">DocuS</h1>
          <p className="text-lg text-blue-200">Nền tảng lớp học của bạn</p>
        </div>

        {/* Card Xác nhận (Giống trong ảnh) */}
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg lg:w-1/2">
          {/* Ảnh bìa lớp */}
          <div className="w-full h-32 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
            {classInfo.img ? (
              <Image 
                src={classInfo.img} 
                alt={classInfo.name} 
                width={400} 
                height={128} 
                className="w-full h-32 object-cover rounded-md"
              />
            ) : (
              <span className="text-gray-500">Class Image</span>
            )}
          </div>

          {/* Thông tin lớp */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">{classInfo.name}</h2>
          </div>

          <div className="flex justify-between my-4 text-sm">
            <div className="flex flex-col">
              <span className="text-gray-500">Mã lớp</span>
              <span className="font-semibold text-gray-800">{classInfo.class_code}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-gray-500">Giáo viên</span>
              <span className="font-semibold text-gray-800">{classInfo.supervisor?.username || 'N/A'}</span>
            </div>
          </div>
          
          {/* 4. Tách thông tin học sinh (đã có trong file bạn gửi) */}
          {/* <div className="border-t border-b border-gray-200 py-4 my-4">
             ... (Thông tin studentInfo) ...
          </div> */}

          {/* Nút Hành động */}
          {isAlreadyJoined ? (
            <button
              disabled
              className="w-full bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold text-base flex items-center justify-center gap-2"
            >
              <Check size={20} />
              Bạn đã ở trong lớp này
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold text-base hover:bg-green-600 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : (
                <>
                  Tham gia lớp
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          )}

          {/* Hiển thị lỗi */}
          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-600">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 5. Render Modal chung khi state là true */}
      {showApprovalModal && (
        <ApprovalModal 
          onClose={() => setShowApprovalModal(false)}
          redirectPath="/class"
        />
      )}
    </>
  );
}

