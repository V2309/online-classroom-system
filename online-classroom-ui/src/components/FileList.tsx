"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { Download, FileText, Trash2, Eye, Loader2, FileCode, FileSpreadsheet } from "lucide-react";
import Table from "@/components/Table";
import FileViewersModal from "./modals/FileViewersModal";
import { documentService } from "@/services/document.service";
import { DocumentItem } from "@/types/document";

interface FileListProps {
  refreshTrigger?: number;
  role?: string | null;
  initialFiles?: DocumentItem[];
  classCode?: string;
  onFilesUpdate?: (files: DocumentItem[]) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const formatDate = (dateString: string | Date) =>
  dateFormatter.format(new Date(dateString));

const getFileBadge = (type: string) => {
  if (type.includes("pdf")) {
    return (
      <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center flex-shrink-0 shadow-2xs font-bold text-[10px]">
        PDF
      </div>
    );
  }
  if (type.includes("word") || type.includes("doc")) {
    return (
      <div className="w-9 h-9 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center flex-shrink-0 shadow-2xs font-bold text-[10px]">
        DOC
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-2xl bg-muted border border-border text-secondary flex items-center justify-center flex-shrink-0 shadow-2xs font-bold text-[10px]">
      FILE
    </div>
  );
};

const FileList = ({
  refreshTrigger,
  role,
  initialFiles = [],
  classCode: propClassCode,
  onFilesUpdate,
}: FileListProps) => {
  const [files, setFiles] = useState<DocumentItem[]>(initialFiles);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentItem | null>(null);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classCode = propClassCode || (params?.id as string);

  const fetchFiles = useCallback(async () => {
    if (!classCode) return;

    try {
      setLoading(true);
      const currentSearch = searchParams.get("search");
      const res = await documentService.getDocuments({
        classCode,
        search: currentSearch || undefined,
      });

      const newFiles = res.files || [];
      setFiles(newFiles);

      if (onFilesUpdate) {
        onFilesUpdate(newFiles);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Lỗi khi tải danh sách tài liệu");
    } finally {
      setLoading(false);
    }
  }, [classCode, onFilesUpdate, searchParams]);

  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  useEffect(() => {
    const currentSearch = searchParams.get("search");
    if (currentSearch !== null) {
      fetchFiles();
    }
  }, [searchParams, fetchFiles]);

  const columns = useMemo(
    () => [
      { header: "Tên tài liệu", accessor: "name" },
      {
        header: "Người tải lên",
        accessor: "uploader",
        className: "hidden lg:table-cell",
      },
      {
        header: "Ngày tải lên",
        accessor: "date",
        className: "hidden lg:table-cell",
      },
      ...(role === "teacher"
        ? [
            {
              header: "Lượt xem",
              accessor: "views",
              className: "hidden md:table-cell",
            },
          ]
        : [
            {
              header: "Trạng thái",
              accessor: "status",
              className: "hidden md:table-cell",
            },
          ]),
      { header: "Hành động", accessor: "action" },
    ],
    [role]
  );

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchFiles();
    }
  }, [refreshTrigger, fetchFiles]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        router.refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [router]);

  const handleDeleteFile = useCallback(
    async (fileId: string) => {
      const confirmed = confirm("Bạn có chắc chắn muốn xóa tài liệu này?");
      if (confirmed) {
        try {
          await documentService.deleteDocument(fileId);
          toast.success("Xóa tài liệu thành công");
          const updatedFiles = files.filter((f) => f.id !== fileId);
          setFiles(updatedFiles);

          if (onFilesUpdate) {
            onFilesUpdate(updatedFiles);
          }
        } catch (error: any) {
          console.error("Error deleting file:", error);
          toast.error(error.response?.data?.message || "Lỗi khi xóa tài liệu");
        }
      }
    },
    [files, onFilesUpdate]
  );

  const handleShowViewers = useCallback((file: DocumentItem) => {
    setSelectedFile(file);
    setShowViewersModal(true);
  }, []);

  const renderRow = useCallback(
    (file: DocumentItem) => {
      let detailLink = `/class/${classCode}/documents/${file.id}`;

      return (
        <tr key={file.id} className="border-b border-border/70 hover:bg-muted/40 transition-colors">
          {/* Tên tài liệu */}
          <td className="p-3.5 sm:p-4">
            <Link href={detailLink} className="flex items-center gap-3 group">
              {getFileBadge(file.type)}
              <div className="min-w-0 flex-1">
                <h3 className="font-heading font-bold text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {file.name}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {file.size ? formatFileSize(file.size) : "Tài liệu học"}
                </p>
              </div>
            </Link>
          </td>

          {/* Người tải lên */}
          <td className="p-3.5 sm:p-4 hidden lg:table-cell">
            <span className="text-xs font-semibold text-secondary">
              {file.teacher?.username || "Giáo viên"}
            </span>
          </td>

          {/* Ngày tải lên */}
          <td className="p-3.5 sm:p-4 hidden lg:table-cell">
            <time
              dateTime={new Date(file.uploadedAt).toISOString()}
              className="text-xs text-muted-foreground font-medium"
            >
              {formatDate(file.uploadedAt)}
            </time>
          </td>

          {/* Lượt xem (cho teacher) hoặc Trạng thái (cho student) */}
          {role === "teacher" ? (
            <td className="p-3.5 sm:p-4 hidden md:table-cell">
              <button
                type="button"
                onClick={() => handleShowViewers(file)}
                className="flex items-center gap-1.5 px-3 py-1 bg-card hover:bg-muted text-secondary hover:text-foreground text-xs font-bold rounded-full border border-border transition-all cursor-pointer shadow-2xs"
                title="Xem danh sách người đã xem"
              >
                <Eye className="w-3.5 h-3.5 text-primary" />
                <span>{file._count?.views || 0} người xem</span>
              </button>
            </td>
          ) : (
            <td className="p-3.5 sm:p-4 hidden md:table-cell">
              {file.viewedByCurrentUser ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Đã xem
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-muted text-secondary">
                  Chưa xem
                </span>
              )}
            </td>
          )}

          {/* Actions */}
          <td className="p-3.5 sm:p-4">
            <div className="flex items-center gap-1.5">
              <Link
                href={detailLink}
                className="p-1.5 hover:bg-muted rounded-xl text-secondary hover:text-foreground transition-all cursor-pointer"
                title="Xem chi tiết tài liệu"
              >
                <Eye className="w-4 h-4" />
              </Link>
              <a
                href={file.url}
                download={file.name}
                className="p-1.5 hover:bg-muted rounded-xl text-secondary hover:text-foreground transition-all cursor-pointer"
                title="Tải xuống tài liệu"
              >
                <Download className="w-4 h-4" />
              </a>
              {role === "teacher" && (
                <button
                  type="button"
                  onClick={() => handleDeleteFile(file.id)}
                  className="p-1.5 hover:bg-rose-50 rounded-xl text-muted-foreground hover:text-rose-700 transition-all cursor-pointer"
                  title="Xóa tài liệu"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </td>
        </tr>
      );
    },
    [classCode, role, handleShowViewers, handleDeleteFile]
  );

  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : files.length > 0 ? (
        <Table columns={columns} renderRow={renderRow} data={files} />
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-14 h-14 rounded-3xl bg-accent text-primary flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="font-heading font-bold text-foreground text-base">Chưa có tài liệu nào</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {role === "teacher"
              ? "Hãy tải lên tài liệu PDF hoặc Word để học sinh có thể đọc và tham khảo."
              : "Giáo viên chưa đăng tải tài liệu nào cho lớp học này."}
          </p>
        </div>
      )}

      {showViewersModal && selectedFile && (
        <FileViewersModal
          docId={selectedFile.id}
          fileName={selectedFile.name}
          isOpen={showViewersModal}
          onClose={() => {
            setShowViewersModal(false);
            setSelectedFile(null);
          }}
        />
      )}
    </div>
  );
};

export default FileList;