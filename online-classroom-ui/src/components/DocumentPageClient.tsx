// document-page-client.tsx
"use client";
import FileUpload from "@/components/FileUpload";
import FileList from "@/components/FileList";
import Pagination from "@/components/Pagination";
import { useState, useCallback } from "react"; // Import useCallback

interface FileData {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  teacher: {
    username: string;
  };
  class?: {
    name: string;
    class_code: string | null;
  } | null;
  _count?: {
    views: number;
  };
  views?: Array<{
    user: {
      id: string;
      username: string;
    };
    viewedAt: string;
  }>;
  viewedByCurrentUser?: boolean;
  firstViewedAt?: string | null;
}

interface DocumentPageClientProps {
  userRole?: string;
  initialFiles: FileData[];
  classCode: string;
  count: number;
  page: number;
}

export default function DocumentPageClient({
  userRole,
  initialFiles,
  classCode,
  count,
  page,
}: DocumentPageClientProps) {
  const [files, setFiles] = useState(initialFiles);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // TỐI ƯU: Bọc hàm trong useCallback để ổn định
  const handleFileUploaded = useCallback(() => {
    // Tăng trigger để refresh danh sách file
    setRefreshTrigger((prev) => prev + 1);
  }, []); // Không có dependency, hàm này sẽ ổn định

  // Callback để cập nhật danh sách files khi có thay đổi
  const handleFilesUpdate = useCallback((newFiles: FileData[]) => {
    setFiles(newFiles);
  }, []);

  return (
    // RESPONSIVE: flex-col đã là lựa chọn tốt cho responsive
    <div className="flex bg-white font-sans h-full flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Tài liệu lớp học</h1>

        {/* Chỉ hiển thị FileUpload nếu user là teacher */}
        {userRole === "teacher" && (
          <FileUpload onFileUploaded={handleFileUploaded} />
        )}
      </div>

      {/* File List */}
      <div className="flex-1">
        <FileList 
          refreshTrigger={refreshTrigger} 
          role={userRole || null}
          initialFiles={files}
          classCode={classCode}
          onFilesUpdate={handleFilesUpdate}
        />
      </div>

      {/* Pagination */}
      <div className="mt-4">
        {files.length > 0 && <Pagination page={page} count={count} />}
      </div>
    </div>
  );
}
