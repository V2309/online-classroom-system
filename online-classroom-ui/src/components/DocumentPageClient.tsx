"use client";

import FileUpload from "@/components/FileUpload";
import FileList from "@/components/FileList";
import Pagination from "@/components/Pagination";
import { useState, useCallback } from "react";
import { DocumentItem } from "@/types/document";
import ClassPageHeader from "@/components/ClassPageHeader";
import TableSearch from "@/components/TableSearch";
import { Upload, X } from "lucide-react";

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
  const [showUpload, setShowUpload] = useState(false);

  const handleFileUploaded = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    setShowUpload(false);
  }, []);

  const handleFilesUpdate = useCallback((newFiles: DocumentItem[]) => {
    setFiles(newFiles);
  }, []);

  return (
    <div className="flex bg-background text-foreground font-sans h-full flex-col">
      {/* Header chuẩn chung */}
      <ClassPageHeader title="Tài liệu lớp học" count={count}>
        <div className="flex items-center gap-3">
          <TableSearch />
          {userRole === "teacher" && (
            <button
              onClick={() => setShowUpload(!showUpload)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                showUpload
                  ? "bg-muted text-foreground hover:bg-accent border border-border"
                  : "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm"
              }`}
            >
              {showUpload ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Đóng</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải tài liệu lên</span>
                </>
              )}
            </button>
          )}
        </div>
      </ClassPageHeader>

      {/* Box Upload khi bật (chỉ dành cho giáo viên) */}
      {userRole === "teacher" && showUpload && (
        <div className="p-4 border-b border-border bg-card">
          <FileUpload onFileUploaded={handleFileUploaded} />
        </div>
      )}

      {/* File List */}
      <div className="flex-1 p-4">
        <FileList
          refreshTrigger={refreshTrigger}
          role={userRole || null}
          initialFiles={files}
          classCode={classCode}
          onFilesUpdate={handleFilesUpdate}
        />
      </div>

      {/* Pagination */}
      {files.length > 0 && (
        <div className="p-4 border-t border-border">
          <Pagination page={page} count={count} />
        </div>
      )}
    </div>
  );
}
