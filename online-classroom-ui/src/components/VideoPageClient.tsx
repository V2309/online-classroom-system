// page/class/[id]/video/VideoPageclient.tsx
"use client";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import FolderForm from "@/components/forms/FolderForm";
import {
  FolderOpen,
  Folder,
  MoreVertical,
  Play,
  Eye,
  Pencil,
} from "lucide-react";
import {
  CourseWithDetails,
  FolderWithCourseCount,
} from "@/app/(page)/class/[id]/video/page";
import { useState, useCallback } from "react";
import FormModal from "./FormModal"; // Giả sử component này tồn tại
import MoveCourseModal from "@/components/modals/MoveCourseModal";
// TỐI ƯU: Tạo formatter một lần bên ngoài component
const dateFormatter = new Intl.DateTimeFormat("vi-VN");
const formatDate = (date: Date) => dateFormatter.format(new Date(date));

// Props
interface VideoListProps {
  data: CourseWithDetails[];
  count: number;
  folders: FolderWithCourseCount[];
  allCoursesCount: number;
  page: number;
  classCode: string;
  role: string | null;
}

export default function VideoList({
  data,
  count,
  folders,
  allCoursesCount,
  page,
  classCode,
  role,
}: VideoListProps) {
  // --- State ---
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [folderFormType, setFolderFormType] = useState<"create" | "update">(
    "create"
  );
  const [folderFormData, setFolderFormData] = useState<any>(null);

  // BƯỚC 3.2: Thêm state cho modal di chuyển
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [courseToMove, setCourseToMove] = useState<CourseWithDetails | null>(
    null
  );
  // --- Hooks ---
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeFolderId = searchParams.get("folderId");

  const columns = [
    { header: "Tên bài giảng", accessor: "title" },
    {
      header: "Trạng thái",
      accessor: "status",
      className: "hidden md:table-cell",
    },
    {
      header: "Ngày tạo",
      accessor: "date",
      className: "hidden lg:table-cell",
    },
    { header: "Actions", accessor: "action" },
  ];

  // --- Callbacks (TỐI ƯU) ---
  const handleOpenMenu = useCallback((id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  }, []);

  const handleOpenFolderMenu = useCallback((id: string) => {
    setOpenFolderMenuId((prev) => (prev === id ? null : id));
  }, []);

  const handleFormSuccess = useCallback(() => {
    router.refresh(); // Refresh trang để cập nhật danh sách folder
  }, [router]);

  const handleCreateFolder = useCallback(() => {
    setFolderFormType("create");
    setFolderFormData(null);
    setShowFolderForm(true);
  }, []);

  const handleEditFolder = useCallback(
    (folder: FolderWithCourseCount) => {
      setFolderFormType("update");
      setFolderFormData({
        id: folder.id,
        name: folder.name,
        description: folder.description || "",
        color: folder.color || "#3B82F6",
        classCode: classCode,
      });
      setShowFolderForm(true);
      setOpenFolderMenuId(null);
    },
    [classCode]
  );

  // BƯỚC 3.3: Tạo callback để mở modal di chuyển
  const handleOpenMoveModal = useCallback((course: CourseWithDetails) => {
    setCourseToMove(course);
    setShowMoveModal(true);
    setOpenMenuId(null); // Đóng menu '...'
  }, []);

  // TỐI ƯU: Bọc renderRow trong useCallback
  const renderRow = useCallback(
    (course: CourseWithDetails) => (
      <tr
        key={course.id}
        className="border-b border-gray-200 hover:bg-slate-50"
      >
        {/* Tên bài giảng */}
        <td className="p-4">
          <Link
            href={`/class/${classCode}/video/${course.id}`}
            className="flex items-center gap-4 group"
          >
            <div className="relative w-20 h-12 overflow-hidden rounded-lg bg-slate-200 flex-shrink-0">
              {course.thumbnailUrl ? (
                <Image
                  src={course.thumbnailUrl}
                  alt={course.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                {course.title}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                <span className="font-medium text-blue-600">
                  {course._count.videos} videos
                </span>
                {course.folder && <span className="mx-2">•</span>}
                {course.folder && <span>{course.folder.name}</span>}
              </p>
            </div>
          </Link>
        </td>
        {/* Trạng thái */}
        <td className="hidden md:table-cell p-4">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              course.isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {course.isActive ? "Hoạt động" : "Đã tắt"}
          </span>
        </td>
        {/* Ngày tạo */}
        <td className="hidden lg:table-cell p-4">
          <time
            dateTime={course.createdAt.toISOString()}
            className="text-sm text-slate-500"
          >
            {formatDate(course.createdAt)}
          </time>
        </td>
        {/* Actions */}
        <td className="p-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => handleOpenMenu(course.id)} // Dùng handler
              className="p-1 rounded-full hover:bg-slate-200"
            >
              <MoreVertical className="w-4 h-4 text-slate-500" />
            </button>
            {openMenuId === course.id && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-10">
                <div className="px-1 py-2">
                  <Link
                    href={`/class/${classCode}/video/${course.id}`}
                    className="px-2 py-2 flex items-center gap-3 w-full text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Xem chi tiết</span>
                  </Link>
                  {role === "teacher" && (
                    <>
                      <Link
                        href={`/class/${classCode}/video/${course.id}/edit`}
                        className="px-2 py-2 flex items-center gap-3 w-full text-left text-sm text-slate-700 hover:bg-slate-100"
                      >
                        <Pencil className="w-4 h-4" />
                        <span>Chỉnh sửa</span>
                      </Link>
                      <button 
                      onClick={() => handleOpenMoveModal(course)}
                      className="px-2 py-2 flex items-center gap-3 w-full text-left text-sm text-slate-700 hover:bg-slate-100">
                        <Folder className="w-4 h-4" />
                        <span>Di chuyển</span>
                      </button>
                      <FormModal
                        table="course"
                        type="delete"
                        id={course.id}
                        data={{ classCode: classCode }}
                      />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
    ),
   [classCode, role, openMenuId, handleOpenMenu, handleOpenMoveModal]// Dependencies cho renderRow
  );

  return (
    // RESPONSIVE: flex-col trên di động, flex-row trên desktop
    <div className="flex flex-col md:flex-row bg-white font-sans min-h-screen">
      {/* Sidebar */}
      {/* RESPONSIVE: w-full trên di động, md:w-64 trên desktop */}
      <aside className="w-full md:w-64 border-b md:border-r border-slate-200 p-4 shrink-0">
        {/* RESPONSIVE: flex-row + cuộn ngang trên di động, md:flex-col trên desktop */}
        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:space-y-1">
          <Link
            href={`/class/${classCode}/video`}
            // RESPONSIVE: Thêm shrink-0 để không bị co lại khi cuộn ngang
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium shrink-0 relative transition-colors ${
              !activeFolderId
                ? "text-blue-700 before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-blue-600 before:rounded-r-full"
                : "text-slate-700 hover:bg-slate-200"
            }`}
          >
            <FolderOpen className="w-5 h-5" />
            <span>Tất cả bài giảng</span>
            <span className="ml-auto text-xs bg-slate-200 px-2 py-1 rounded-full">
              {allCoursesCount}
            </span>
          </Link>
          {folders.map((folder) => (
            <div
              key={folder.id}
              // RESPONSIVE: Thêm shrink-0
              className="relative group flex items-center justify-between shrink-0"
            >
              <Link
                href={`/class/${classCode}/video?folderId=${folder.id}`}
                className={`flex-1 relative overflow-hidden flex items-center gap-3 pl-3 pr-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeFolderId === folder.id
                    ? "text-blue-700 before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-blue-600 before:rounded-r-full"
                    : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                <div className="relative flex items-center">
                  <Folder
                    className="w-5 h-5"
                    style={{ color: folder.color || "#64748b" }}
                  />
                </div>
                <span className="truncate flex-1">{folder.name}</span>
                <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">
                  {folder._count.courses}
                </span>
              </Link>
              {/* Nút 3 chấm cho folder */}
              {role === "teacher" && (
                <div className="relative">
                  <button
                    onClick={() => handleOpenFolderMenu(folder.id)} // Dùng handler
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-slate-300 mr-2"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-600" />
                  </button>
                  {/* Menu con của folder */}
                  {openFolderMenuId === folder.id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-md shadow-lg border border-slate-200 z-20">
                      <div className="p-1">
                        <button
                          onClick={() => handleEditFolder(folder)} // Dùng handler
                          className="w-full px-2 py-1.5 text-xs text-left text-slate-700 hover:bg-slate-100 rounded flex items-center gap-2"
                        >
                          <Pencil className="w-3 h-3" />
                          Chỉnh sửa
                        </button>
                        <FormModal
                          table="folder"
                          type="delete"
                          id={folder.id}
                          data={{ classCode }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white p-4 rounded-md flex flex-col">
        {/* Top */}
        {/* RESPONSIVE: flex-col + items-start trên di động, md:flex-row + items-center trên desktop */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
          <h1 className="hidden md:block text-lg font-semibold">
            Danh sách bài giảng ({count})
          </h1>
          {/* RESPONSIVE: gap-2 và w-full trên di động */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <TableSearch />
            {role === "teacher" && (
              <>
                <button
                  onClick={handleCreateFolder} // Dùng handler
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap transition-colors"
                >
                  Tạo thư mục
                </button>
                <Link
                  href={`/class/${classCode}/video/add`}
                  className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 whitespace-nowrap"
                >
                  Tạo khóa học
                </Link>
              </>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1">
          {data.length > 0 ? (
            <Table columns={columns} renderRow={renderRow} data={data} />
          ) : (
            // Trạng thái trống (đã responsive)
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-10">
              <FolderOpen className="w-16 h-16 mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-700">
                {activeFolderId
                  ? "Thư mục này trống"
                  : "Chưa có bài giảng nào"}
              </h3>
              <p className="mt-2 text-slate-500">
                {role === "teacher"
                  ? "Hãy bắt đầu bằng cách tạo một khóa học mới."
                  : "Nội dung sẽ sớm được cập nhật."}
              </p>
              {role === "teacher" && (
                <Link
                  href={`/class/${classCode}/video/add`}
                  className="mt-6 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Tạo khóa học mới
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4">
          {data.length > 0 && <Pagination page={page} count={count} />}
        </div>
      </main>

      {/* Folder Form Modal */}
      {showFolderForm && (
        <FolderForm
          type={folderFormType}
          data={folderFormData}
          classCode={classCode}
          setOpen={setShowFolderForm}
          onSuccess={handleFormSuccess} // Dùng handler
        />
      )}
      {/* BƯỚC 3.6: Render Modal Di chuyển */}
        {showMoveModal && courseToMove && (
          <MoveCourseModal
            isOpen={showMoveModal}
            onClose={() => setShowMoveModal(false)}
            courseId={courseToMove.id}
            currentFolderId={courseToMove.folderId || null}
            folders={folders} // Truyền danh sách folders xuống
            classCode={classCode}
            onSuccess={() => {
              handleFormSuccess(); // Refresh
              setShowMoveModal(false); // Đóng
            }}
          />
        )}
    </div>
  );
}