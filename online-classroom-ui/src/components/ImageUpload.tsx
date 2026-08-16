"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { uploadService } from "@/services/upload.service";
import { UploadCloud, Camera, Trash2, Loader2 } from "lucide-react";

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

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File quá lớn. Kích thước tối đa là 5MB.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-foreground">Ảnh bìa lớp học</label>

      <div
        className="relative border-2 border-dashed border-border hover:border-primary/40 rounded-2xl p-4 h-48 flex items-center justify-center text-center transition-colors cursor-pointer overflow-hidden bg-muted/30 group"
        onClick={handleClick}
      >
        {previewUrl ? (
          <>
            <Image
              src={previewUrl}
              alt="Ảnh bìa lớp học"
              fill
              unoptimized
              className="object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl backdrop-blur-xs">
              <span className="text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                <Camera className="w-4 h-4" />
                <span>{isUploading ? "Đang upload..." : "Thay đổi ảnh"}</span>
              </span>
            </div>
          </>
        ) : (
          <div className="text-muted-foreground flex flex-col items-center justify-center p-4">
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                <p className="text-xs sm:text-sm font-medium">Đang tải ảnh lên...</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-foreground mb-0.5">Chọn ảnh bìa lớp học</p>
                <p className="text-[11px] text-muted-foreground">Kéo thả hoặc nhấp chuột để chọn ảnh</p>
              </>
            )}
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-2xl backdrop-blur-xs">
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <p className="text-xs font-semibold text-foreground">Đang xử lý ảnh...</p>
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

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className="text-xs font-bold text-primary hover:text-primary-hover transition-colors disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>{previewUrl ? "Thay đổi ảnh bìa" : "Tải ảnh lên"}</span>
        </button>

        {previewUrl && !isUploading && (
          <button
            type="button"
            onClick={() => {
              setPreviewUrl(null);
              onImageUploaded("");
            }}
            className="text-xs font-semibold text-destructive hover:opacity-80 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa ảnh bìa</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs font-medium text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
