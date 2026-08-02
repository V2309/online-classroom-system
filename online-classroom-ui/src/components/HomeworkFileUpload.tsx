// components/HomeworkFileUpload.tsx
"use client";

import { useState } from "react";

interface HomeworkFileUploadProps {
  onFileSelect: (file: File, url: string) => void;
  onError: (error: string) => void;
  accept?: string;
  className?: string;
  label?: string;
  isLoading?: boolean;
}

export default function HomeworkFileUpload({
  onFileSelect,
  onError,
  accept = ".pdf,.doc,.docx",
  className = "",
  label = "Chọn File",
  isLoading = false
}: HomeworkFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (file: File) => {
    // Kiểm tra định dạng file
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      onError("Chỉ hỗ trợ file PDF và Word (.docx)");
      return;
    }

    try {
      // Upload trực tiếp lên AWS S3 (có thời hạn)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('temporary', 'true'); // Đánh dấu là file tạm thời

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const result = await response.json();
      onFileSelect(file, result.fileUrl);
    } catch (error) {
      console.error('Upload error:', error);
      onError("Có lỗi khi tải file lên. Vui lòng thử lại.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-lg font-medium text-blue-600">Đang tải file...</p>
            <p className="text-sm text-gray-500 mt-2">Vui lòng đợi trong giây lát</p>
          </div>
        ) : (
          <>
            <svg className="w-16 h-16 text-gray-400 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Chọn file để tải lên</h3>
            <p className="text-gray-500 mb-6">Kéo thả file vào đây hoặc click để chọn</p>
            <p className="text-sm text-gray-400 mb-6">Hỗ trợ: PDF, Word (.docx)</p>
            
            <input
              type="file"
              accept={accept}
              onChange={handleInputChange}
              className="hidden"
              id="homework-file-upload"
              disabled={isLoading}
            />
            <label
              htmlFor="homework-file-upload"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg cursor-pointer transition-colors inline-block"
            >
              {label}
            </label>
          </>
        )}
      </div>
    </div>
  );
}