// file-list.tsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { Download, FileText, Trash2, Eye, Loader2 } from "lucide-react";
// TỐI ƯU: Xóa import 'getCurrentUser' không sử dụng
import { deleteFile } from "@/lib/actions/file.action";
import Table from "@/components/Table";
import TableSearch from "./TableSearch";
import FileViewersModal from "./modals/FileViewersModal";

// --- Types (Giữ nguyên) ---
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

interface FileListProps {
  refreshTrigger?: number;
  role?: string | null;
  initialFiles?: FileData[];
  classCode?: string;
  onFilesUpdate?: (files: FileData[]) => void;
}

// --- TỐI ƯU: Chuyển helpers ra ngoài component ---

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// TỐI ƯU: Tạo formatter một lần
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const formatDate = (dateString: string) =>
  dateFormatter.format(new Date(dateString));

// TỐI ƯU: Tạo map icon
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
// ----------------------------------------------

const FileList = ({ 
  refreshTrigger, 
  role, 
  initialFiles = [], 
  classCode: propClassCode,
  onFilesUpdate 
}: FileListProps) => {
  const [files, setFiles] = useState<FileData[]>(initialFiles);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classCode = propClassCode || (params?.id as string);

  // Chỉ fetch khi thực sự cần thiết (upload file mới hoặc refresh manual)
  const fetchFiles = useCallback(async () => {
    if (!classCode) return;
    
    try {
      setLoading(true);
      
      // Lấy search param từ URL hiện tại
      const currentSearch = searchParams.get('search');
      const url = currentSearch 
        ? `/api/files?classCode=${classCode}&search=${encodeURIComponent(currentSearch)}`
        : `/api/files?classCode=${classCode}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }
      const data = await response.json();
      const newFiles = data.files || [];
      setFiles(newFiles);
      
      // Gọi callback để cập nhật parent component
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

  // Cập nhật files khi initialFiles thay đổi (từ server)
  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  // Fetch files mới khi search params thay đổi hoặc khi cần search
  useEffect(() => {
    const currentSearch = searchParams.get('search');
    // Fetch khi có search hoặc khi search được clear (về empty)
    if (currentSearch !== null) {
      fetchFiles();
    }
  }, [searchParams, fetchFiles]);

  // TỐI ƯU: Dùng useMemo để 'columns' chỉ tính toán lại khi 'role' thay đổi
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

  // Chỉ fetch khi có refreshTrigger thay đổi (do upload file mới)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchFiles();
    }
  }, [refreshTrigger, fetchFiles]); // Chỉ chạy khi có trigger

  // Refresh server data khi user quay lại trang để cập nhật trạng thái "đã xem"
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refresh server component data thay vì fetch API
        router.refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [router]);

  // TỐI ƯU: Tách hàm delete ra useCallback
  const handleDeleteFile = useCallback(async (fileId: string) => {
    const confirmed = confirm("Bạn có chắc chắn muốn xóa tài liệu này?");
    if (confirmed) {
      try {
        const result = await deleteFile(fileId);
        if (result.success) {
          toast.success("Xóa tài liệu thành công");
          const updatedFiles = files.filter((f) => f.id !== fileId);
          setFiles(updatedFiles);
          
          // Cập nhật parent component
          if (onFilesUpdate) {
            onFilesUpdate(updatedFiles);
          }
        } else {
          toast.error(result.error || "Lỗi khi xóa tài liệu");
        }
      } catch (error) {
        console.error("Error deleting file:", error);
        toast.error("Lỗi khi xóa tài liệu");
      }
    }
  }, [files, onFilesUpdate]); // Dependency để có files mới nhất

  // TỐI ƯU: Tách hàm show viewers ra useCallback
  const handleShowViewers = useCallback((file: FileData) => {
    setSelectedFile(file);
    setShowViewersModal(true);
  }, []); // Không có dependency

  // TỐI ƯU: Bọc renderRow trong useCallback
  const renderRow = useCallback(
    (file: FileData) => {
      let detailLink = `/class/${classCode}/documents/${file.id}`;

      return (
        <tr
          key={file.id}
          className="border-b border-gray-200 hover:bg-slate-50"
        >
          {/* Tên tài liệu */}
          <td className="p-4">
            <Link
              href={detailLink}
              className="flex items-center gap-3 group"
            >
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
              {file.teacher.username}
            </span>
          </td>

          {/* Ngày tải lên */}
          <td className="p-4 hidden lg:table-cell">
            <time
              dateTime={file.uploadedAt}
              className="text-sm text-slate-500"
            >
              {formatDate(file.uploadedAt)}
            </time>
          </td>

          {/* Lượt xem hoặc Trạng thái */}
          {role === "teacher" ? (
            <td className="p-4 hidden md:table-cell">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleShowViewers(file);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {file._count?.views || 0} lượt xem
              </button>
            </td>
          ) : (
            <td className="p-4 hidden md:table-cell">
              {file.viewedByCurrentUser ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Đã xem
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Chưa xem
                </span>
              )}
            </td>
          )}

          {/* Actions */}
          <td className="p-4">
            <div className="flex items-center gap-2">
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                title="Tải xuống"
              >
                <Download className="w-4 h-4" />
              </a>
              <Link
                href={detailLink}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="Xem chi tiết"
              >
                <Eye className="w-4 h-4" />
              </Link>
              {role === "teacher" && (
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
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
    [classCode, role, handleDeleteFile, handleShowViewers] // Dependencies
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 h-full">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    // TỐI ƯU: Đổi tên class cho nhất quán
    <div className="flex flex-col h-full">
      {/* Top */}
      {/* RESPONSIVE: Xếp chồng trên di động, hàng ngang trên desktop */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
        <h1 className="text-lg font-semibold">
          Danh sách tài liệu ({files.length})
        </h1>
        <div className="w-full md:w-auto">
          <TableSearch />
        </div>
      </div>

      {/* List */}
      <div className="flex-1">
        {files.length > 0 ? (
          // RESPONSIVE: Bọc table trong div cuộn ngang
          <div className="overflow-x-auto">
            <Table columns={columns} renderRow={renderRow} data={files} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-10">
            <FileText className="w-16 h-16 mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-700">
              Chưa có tài liệu nào
            </h3>
            <p className="mt-2 text-slate-500">
              {role === "teacher"
                ? "Hãy bắt đầu bằng cách tải lên tài liệu đầu tiên."
                : "Nội dung sẽ sớm được cập nhật."}
            </p>
          </div>
        )}
      </div>

      {/* Modal hiển thị danh sách người xem */}
      {selectedFile && (
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