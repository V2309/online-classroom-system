//src/app/(fullpage)/join/page.tsx
"use client";

import React, { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { classService } from "@/services/class.service";
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

import ApprovalModal from '@/components/modals/ApprovalModal';
// Import thêm icon
import { UserPlus, ArrowLeft, AlertCircle } from 'lucide-react';

export default function JoinClass() {
  const router = useRouter();
  const [codeArr, setCodeArr] = useState(["", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInputChange = (idx: number, value: string) => {
    // Chỉ cho phép chữ và số
    if (!/^[A-Za-z0-9]*$/.test(value)) return; 
    
    const newArr = [...codeArr];
    newArr[idx] = value.toUpperCase().slice(0, 1);
    setCodeArr(newArr);

    // Tự động focus ô tiếp theo
    if (value && idx < 4) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Tự động lùi lại khi bấm Backspace ở ô trống
    if (e.key === "Backspace" && !codeArr[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pastedData = e.clipboardData.getData("text");

    // Kiểm tra nếu dán 1 mã 5 ký tự
    if (pastedData.length === 5 && /^[A-Za-z0-9]{5}$/.test(pastedData)) {
      e.preventDefault(); // Ngăn hành động dán mặc định
      const newCodeArr = pastedData.toUpperCase().split("");
      setCodeArr(newCodeArr);
      inputRefs.current[4]?.focus(); // Focus ô cuối
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeArr.join("");
    // Let's check length: if codeArr is 5, code.length must be 5.
    if (code.length !== 5) {
      setError("Mã lớp phải gồm đúng 5 ký tự.");
      return;
    }
    
    setError("");
    setIsLoading(true);

    try {
      await classService.joinClass(code);
      setShowApprovalModal(true);
    } catch (error: any) {
      setError(error.response?.data?.message || "Mã lớp không đúng hoặc có lỗi xảy ra.");
      setCodeArr(["", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    // Nền gradient Terra
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      
      {/* Nút quay lại ở góc trên bên trái */}
      <button
        onClick={handleGoBack}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
      >
        <ArrowLeft size={16} />
        Quay lại
      </button>
      
      <div className="bg-card rounded-2xl shadow-xl p-8 pt-10 w-full max-w-md border border-border">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            {/* Icon UserPlus */}
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Tham gia lớp học</h1>
          <p className="text-secondary">Nhập mã lớp 5 ký tự do giáo viên cung cấp</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Code Input */}
          <div className="flex justify-center gap-2 sm:gap-4">
            {[0, 1, 2, 3, 4].map((idx) => (
              <input
                key={idx}
                ref={el => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="text"
                maxLength={1}
                value={codeArr[idx]}
                onChange={e => handleInputChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className="w-14 h-14 sm:w-16 sm:h-16 bg-background border-2 border-border rounded-lg text-center text-3xl font-bold text-foreground uppercase focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                disabled={isLoading}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-state-error/10 border border-state-error/20 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-destructive mr-2 flex-shrink-0" />
                <span className="text-destructive text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || codeArr.some(c => c === "")}
            className="w-full bg-primary text-primary-foreground py-3.5 px-4 rounded-lg font-semibold text-base hover:bg-primary-hover disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-lg hover:shadow-primary/20"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang tham gia...
              </>
            ) : (
              "Xác nhận tham gia"
            )}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Mã lớp gồm 5 ký tự chữ cái và số.
          </p>
        </div>
      </div>

      {/* Modal phê duyệt */}
      {showApprovalModal && (
        <ApprovalModal 
          onClose={() => setShowApprovalModal(false)}
          redirectPath="/class"
        />
      )}
    </div>
  );
}