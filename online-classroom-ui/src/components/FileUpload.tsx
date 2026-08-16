"use client";

import { UploadCloud, Loader2, FileCheck } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import { useParams } from "next/navigation";
import { documentService } from "@/services/document.service";
import { uploadService } from "@/services/upload.service";

interface FileUploadProps {
  onFileUploaded?: () => void;
}

const FileUpload = ({ onFileUploaded }: FileUploadProps) => {
  const [uploading, setUploading] = React.useState(false);
  const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(null);
  const params = useParams();
  const classCode = params?.id as string;

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx",
      ],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File quá lớn, dung lượng tối đa 10MB");
        return;
      }

      try {
        setUploading(true);

        const uploadData = await uploadService.uploadDocument(file, "documents");

        await documentService.createDocument({
          name: file.name,
          url: uploadData.url,
          type: file.type || uploadData.type || "application/pdf",
          size: file.size,
          classCode: classCode,
        });

        setUploadedUrl(uploadData.url);
        toast.success("Tải lên và lưu tài liệu thành công!");

        if (onFileUploaded) {
          onFileUploaded();
        }
      } catch (error: any) {
        console.error("Upload error:", error);
        toast.error(
          error.response?.data?.message || "Lỗi khi tải lên hoặc lưu tài liệu"
        );
      } finally {
        setUploading(false);
      }
    },
  });

  return (
    <div className="p-5 bg-white rounded-3xl border border-border shadow-2xs">
      <div
        {...getRootProps({
          className:
            "border-dashed border-2 border-primary/40 rounded-2xl cursor-pointer bg-accent/20 hover:bg-accent/40 py-8 px-4 flex justify-center items-center flex-col transition-all active:scale-[0.99]",
        })}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="mt-2 text-xs sm:text-sm font-semibold text-primary">Đang tải file lên đám mây...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-white text-primary flex items-center justify-center mb-2 shadow-2xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-foreground">
              Kéo thả hoặc nhấp để chọn file tài liệu
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Hỗ trợ định dạng PDF, DOC, DOCX (Tối đa 10MB)
            </p>
          </>
        )}
      </div>

      {uploadedUrl && (
        <div className="mt-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="truncate">Đã tải lên thành công: <b>{uploadedUrl}</b></span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
