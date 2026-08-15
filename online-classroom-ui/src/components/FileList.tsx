// file-list.tsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { Download, FileText, Trash2, Eye, Loader2 } from "lucide-react";
import Table from "@/components/Table";
import TableSearch from "./TableSearch";
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
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

const fileIconMap: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5 text-red-500" />,
  word: <FileText className="w-5 h-5 text-blue-500" />,
  document: <FileText className="w-5 h-5 text-blue-500" />,
  default: <FileText className="w-5 h-5 text-gray-500" />,
};

const getFileIcon = (type: string) => {
  if (type.includes("pdf")) return fileIconMap.pdf;
  if (type.includes("word") || type.includes("document"))
    return fileIconMap.document;
  return fileIconMap.default;
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
          toast.error(
            error.response?.data?.message || "Lỗi khi xóa tài liệu"
          );
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
        <tr
          key={file.id}
          className="border-b border-gray-200 hover:bg-slate-50"
        >
          {/* Tên tài liệu */}
          <td className="p-4">
            <Link href={detailLink} className="flex items-center gap-3 group">
              <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {file.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {file.type.split("/")[1]?.toUpperCase() || "FILE"}
                </p>
              </div>
            </Link>
          </td>

          {/* Người tải lên */}
          <td className="p-4 hidden lg:table-cell">
            <span className="text-sm text-slate-600">
              {file.teacher?.username}
            </span>
          </td>

          {/* Ngày tải lên */}
          <td className="p-4 hidden lg:table-cell">
            <time
              dateTime={new Date(file.uploadedAt).toISOString()}
              className="text-sm text-slate-500"
            >
              {formatDate(file.uploadedAt)}
            </time>
          </td>

          {/* Lượt xem (cho teacher) hoặc Trạng thái (cho student) */}
          {role === "teacher" ? (
            <td className="p-4 hidden md:table-cell">
              <button
                onClick={() => handleShowViewers(file)}
                className="flex items-center space-x-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
                title="Nhấn để xem chi tiết danh sách người đã xem"
              >
                <Eye className="w-3.5 h-3.5 text-gray-500" />
                <span>{file._count?.views || 0}</span>
                <span className="text-gray-400">người xem</span>
              </button>
            </td>
          ) : (
            <td className="p-4 hidden md:table-cell">
              {file.viewedByCurrentUser ? (
                <div className="flex flex-col">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                    Đã xem
                  </span>
                  {file.firstViewedAt && (
                    <span className="text-xs text-gray-400 mt-0.5">
                      Lần đầu: {formatDate(file.firstViewedAt)}
                    </span>
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Chưa xem
                </span>
              )}
            </td>
          )}

          {/* Actions */}
          <td className="p-4">
            <div className="flex items-center space-x-2">
              <Link
                href={detailLink}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-blue-600 transition-colors"
                title="Xem chi tiết tài liệu"
              >
                <Eye className="w-4 h-4" />
              </Link>
              <a
                href={file.url}
                download={file.name}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-blue-600 transition-colors"
                title="Tải xuống tài liệu"
              >
                <Download className="w-4 h-4" />
              </a>
              {role === "teacher" && (
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  className="p-1.5 hover:bg-red-50 rounded text-gray-600 hover:text-red-600 transition-colors"
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Danh sách tài liệu</h2>
        <TableSearch />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : files.length > 0 ? (
        <Table columns={columns} renderRow={renderRow} data={files} />
      ) : (
        <div className="text-center py-10 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Chưa có tài liệu nào trong lớp học này</p>
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