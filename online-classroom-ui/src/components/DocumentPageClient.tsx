// document-page-client.tsx
"use client";
import FileUpload from "@/components/FileUpload";
import FileList from "@/components/FileList";
import Pagination from "@/components/Pagination";
import { useState, useCallback } from "react";
import { DocumentItem } from "@/types/document";

interface DocumentPageClientProps {
  userRole?: string;
  initialFiles: DocumentItem[];
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

  const handleFileUploaded = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleFilesUpdate = useCallback((newFiles: DocumentItem[]) => {
    setFiles(newFiles);
  }, []);

  return (
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
