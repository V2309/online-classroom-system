"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { uploadService } from "@/services/upload.service";

interface ImageUploadProps {
  currentImage?: string | null;
  classCode: string;
  onImageUploaded: (imageUrl: string) => void;
}

export default function ImageUpload({ currentImage, classCode, onImageUploaded }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("File quá lớn. Kích thước tối đa là 5MB.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload to NestJS server
      const result = await uploadService.uploadClassImage(file);
      const imageUrl = result.url || result.filePath;

      setPreviewUrl(result.url || preview);
      onImageUploaded(imageUrl);
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.response?.data?.message || "Có lỗi xảy ra khi upload ảnh");
      setPreviewUrl(currentImage || null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-6">
      <label className="block text-gray-800 font-bold mb-2">Ảnh bìa</label>
      
      <div 
        className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 h-48 flex items-center justify-center text-center hover:border-blue-400 transition-colors cursor-pointer"
        onClick={handleClick}
      >
        {previewUrl ? (
          <>
            <Image
              src={previewUrl}
              alt="Ảnh bìa lớp học"
              fill
              unoptimized
              className="object-cover rounded-md"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
              <span className="text-white font-semibold">
                {isUploading ? "Đang upload..." : "Thay đổi ảnh"}
              </span>
            </div>
          </>
        ) : (
          <div className="text-gray-500">
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-sm">Đang upload...</p>
              </div>
            ) : (
              <>
                <svg className="mx-auto h-12 w-12 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm">Chọn ảnh bìa cho lớp học</p>
                <p className="text-xs text-gray-400 mt-1">Kéo thả hoặc click để chọn</p>
              </>
            )}
          </div>
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-sm text-gray-600">Đang upload...</p>
            </div>
          </div>
        )}
      </div>

      <input 
        ref={fileInputRef}
        type="file" 
        className="hidden" 
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      
      <div className="mt-2 flex items-center justify-between">
        <button 
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer transition-colors disabled:opacity-50"
        >
          📷 {previewUrl ? "Thay đổi ảnh" : "Chọn ảnh mới"}
        </button>
        
        {previewUrl && !isUploading && (
          <button 
            type="button"
            onClick={() => {
              setPreviewUrl(null);
              onImageUploaded("");
            }}
            className="text-sm text-red-600 hover:text-red-800 cursor-pointer transition-colors"
          >
            🗑️ Xóa ảnh
          </button>
        )}
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500">
        <p>• Định dạng: JPEG, PNG, WebP, GIF</p>
        <p>• Kích thước tối đa: 5MB</p>
        <p>• Khuyến nghị: 1200x800px hoặc tỷ lệ 3:2</p>
      </div>
    </div>
  );
}
