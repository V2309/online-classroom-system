"use client";

import { Inbox, Loader2 } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import { useParams } from "next/navigation";

interface FileUploadProps {
  onFileUploaded?: () => void; // Callback để refresh danh sách file
}

const FileUpload = ({ onFileUploaded }: FileUploadProps) => {
  const [uploading, setUploading] = React.useState(false);
  const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(null);
  const params = useParams();
  const classCode = params?.id as string; // Lấy class code từ URL

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
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
        
        // 1. Upload file lên S3 thông qua API
        const formData = new FormData();
        formData.append("file", file);
        formData.append("classCode", classCode);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        const uploadData = await uploadResponse.json();
        
        // 2. Lưu thông tin file vào database
        const saveResponse = await fetch('/api/files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: uploadData.fileName,
            url: uploadData.fileUrl,
            type: uploadData.fileType,
            size: uploadData.fileSize,
            classCode: classCode,
          }),
        });

        if (!saveResponse.ok) {
          throw new Error('Failed to save file to database');
        }

        const saveData = await saveResponse.json();
        console.log('File saved to database:', saveData);

        setUploadedUrl(uploadData.fileUrl);
        toast.success("Tải lên và lưu tài liệu thành công!");
        
        // Gọi callback để refresh danh sách file nếu có
        if (onFileUploaded) {
          onFileUploaded();
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Lỗi khi tải lên hoặc lưu tài liệu");
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
            <p className="mt-2 text-sm text-slate-400">Kéo thả hoặc chọn file tài liệu (PDF, Word)</p>
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
