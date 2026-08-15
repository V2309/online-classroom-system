"use client";

import { Inbox, Loader2 } from "lucide-react";
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
        toast.error("File quá lớn, tối đa 10MB");
        return;
      }

      try {
        setUploading(true);

        // 1. Upload file tài liệu lên Cloudflare R2 thông qua backend uploadService
        const uploadData = await uploadService.uploadDocument(file, "documents");

        // 2. Lưu thông tin file vào database thông qua documentService
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
    <div className="p-4 bg-white rounded-xl shadow">
      <div
        {...getRootProps({
          className:
            "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col",
        })}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <>
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <p className="mt-2 text-sm text-slate-400">Đang tải lên...</p>
          </>
        ) : (
          <>
            <Inbox className="w-10 h-10 text-blue-500" />
            <p className="mt-2 text-sm text-slate-400">
              Kéo thả hoặc chọn file tài liệu (PDF, Word)
            </p>
          </>
        )}
      </div>

      {uploadedUrl && (
        <div className="mt-4 text-sm text-green-600 break-all">
          <p>File đã tải lên:</p>
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600"
          >
            {uploadedUrl}
          </a>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
