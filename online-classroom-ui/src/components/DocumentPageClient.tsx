"use client";

import FileUpload from "@/components/FileUpload";
import FileList from "@/components/FileList";
import Pagination from "@/components/Pagination";
import { useState, useCallback } from "react";
import { DocumentItem } from "@/types/document";
import TableSearch from "@/components/TableSearch";
import { FolderOpen, Upload, X, Plus } from "lucide-react";

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
    <div className="bg-white rounded-3xl border border-border shadow-sm flex flex-col h-full overflow-hidden text-foreground">
      {/* ── HEADER CARD TÍCH HỢP ── */}
      <div className="p-4 sm:p-5 border-b border-border/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 flex-shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent text-primary flex items-center justify-center shadow-2xs flex-shrink-0">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-heading font-bold text-foreground leading-tight">
                Tài liệu lớp học
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent text-primary">
                {count} tài liệu
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-secondary mt-0.5">
              Tài liệu PDF, Word và giáo trình tự học
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 flex-wrap self-stretch lg:self-auto justify-between lg:justify-end">
          <div className="w-full sm:w-60">
            <TableSearch />
          </div>

          {userRole === "teacher" && (
            <button
              type="button"
              onClick={() => setShowUpload(!showUpload)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-2xl transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap ${
                showUpload
                  ? "bg-muted hover:bg-muted/80 text-secondary border border-border"
                  : "bg-primary hover:bg-primary-hover text-primary-foreground"
              }`}
            >
              {showUpload ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Đóng tải lên</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Tải tài liệu lên</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Box Upload khi bật (chỉ dành cho giáo viên) */}
      {userRole === "teacher" && showUpload && (
        <div className="p-4 sm:p-5 border-b border-border/80 bg-accent/20 animate-in fade-in zoom-in-95 duration-150">
          <FileUpload onFileUploaded={handleFileUploaded} />
        </div>
      )}

      {/* File List cuộn nội bộ */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto min-h-0 scrollbar-thin">
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
        <div className="p-4 border-t border-border/80 flex-shrink-0 bg-white">
          <Pagination page={page} count={count} />
        </div>
      )}
    </div>
  );
}
