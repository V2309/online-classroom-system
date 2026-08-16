// page/class/[id]/video/VideoPageclient.tsx
"use client";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import Link from "next/link";
import Image from "@/components/Image";
import { useSearchParams, useRouter } from "next/navigation";
import FolderForm from "@/components/forms/FolderForm";
import {
  FolderOpen,
  Folder,
  MoreVertical,
  Play,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  CourseWithDetails,
  FolderWithCourseCount,
} from "@/app/(page)/class/[id]/video/page";
import { useState, useCallback } from "react";
import MoveCourseModal from "@/components/modals/MoveCourseModal";
import { courseService } from "@/services/course.service";
import { toast } from "react-toastify";
import ClassPageHeader from "@/components/ClassPageHeader";

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

  const handleDeleteCourse = useCallback(
    async (courseId: string) => {
      if (!confirm("Bạn có chắc chắn muốn xóa khóa học này không?")) return;
      try {
        await courseService.deleteCourse(courseId);
        toast.success("Khóa học đã được xóa thành công!");
        router.refresh();
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Có lỗi xảy ra khi xóa khóa học."
        );
      }
    },
    [router]
  );

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      if (
        !confirm(
          "Bạn có chắc chắn muốn xóa thư mục này không? Các khóa học sẽ chuyển về 'Tất cả'."
        )
      )
        return;
      try {
        await courseService.deleteFolder(folderId);
        toast.success("Thư mục đã được xóa thành công!");
        router.refresh();
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Có lỗi xảy ra khi xóa thư mục."
        );
      }
    },
    [router]
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
                  path={course.thumbnailUrl}
                  alt={course.title}
                  w={80}
                  h={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {course.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium text-primary">
                  {course._count?.videos || 0} videos
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
                ? "bg-state-success/15 text-state-success"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {course.isActive ? "Hoạt động" : "Đã tắt"}
          </span>
        </td>
        {/* Ngày tạo */}
        <td className="hidden lg:table-cell p-4">
          <time
            dateTime={new Date(course.createdAt).toISOString()}
            className="text-sm text-muted-foreground"
          >
            {formatDate(new Date(course.createdAt))}
          </time>
        </td>
        {/* Actions */}
        <td className="p-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => handleOpenMenu(course.id)}
              className="p-1 rounded-full hover:bg-accent"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
            {openMenuId === course.id && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-xl shadow-lg border border-border z-10">
                <div className="px-1 py-2">
                  <Link
                    href={`/class/${classCode}/video/${course.id}`}
                    className="px-2 py-2 flex items-center gap-3 w-full text-left text-sm text-secondary hover:bg-accent hover:text-foreground rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Xem chi tiết</span>
                  </Link>
                  {role === "teacher" && (
                    <>
                      <Link
                        href={`/class/${classCode}/video/${course.id}/edit`}
                        className="px-2 py-2 flex items-center gap-3 w-full text-left text-sm text-secondary hover:bg-accent hover:text-foreground rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        <span>Chỉnh sửa</span>
                      </Link>
                      <button 
                        onClick={() => handleOpenMoveModal(course)}
                        className="px-2 py-2 flex items-center gap-3 w-full text-left text-sm text-secondary hover:bg-accent hover:text-foreground rounded-lg transition-colors"
                      >
                        <Folder className="w-4 h-4" />
                        <span>Di chuyển</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="px-2 py-2 flex items-center gap-3 w-full text-left text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Xóa</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
    ),
    [classCode, role, openMenuId, handleOpenMenu, handleOpenMoveModal, handleDeleteCourse]
  );


  return (
    <div className="flex flex-col md:flex-row bg-background text-foreground font-sans min-h-screen">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-r border-border p-4 shrink-0 bg-card">
        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:space-y-1">
          <Link
            href={`/class/${classCode}/video`}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium shrink-0 relative transition-colors ${
              !activeFolderId
                ? "text-primary bg-accent font-semibold before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-primary before:rounded-r-full"
                : "text-secondary hover:bg-accent/50 hover:text-foreground"
            }`}
          >
            <FolderOpen className="w-5 h-5" />
            <span>Tất cả bài giảng</span>
            <span className="ml-auto text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
              {allCoursesCount}
            </span>
          </Link>
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="relative group flex items-center justify-between shrink-0"
            >
              <Link
                href={`/class/${classCode}/video?folderId=${folder.id}`}
                className={`flex-1 relative overflow-hidden flex items-center gap-3 pl-3 pr-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFolderId === folder.id
                    ? "text-primary bg-accent font-semibold before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-primary before:rounded-r-full"
                    : "text-secondary hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <div className="relative flex items-center">
                  <Folder
                    className="w-5 h-5"
                    style={{ color: folder.color || "var(--accent-primary)" }}
                  />
                </div>
                <span className="truncate flex-1">{folder.name}</span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  {folder._count?.courses || 0}
                </span>
              </Link>
              {/* Nút 3 chấm cho folder */}
              {role === "teacher" && (
                <div className="relative">
                  <button
                    onClick={() => handleOpenFolderMenu(folder.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-accent mr-2"
                  >
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {/* Menu con của folder */}
                  {openFolderMenuId === folder.id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-card rounded-xl shadow-lg border border-border z-20">
                      <div className="p-1">
                        <button
                          onClick={() => handleEditFolder(folder)}
                          className="w-full px-2 py-1.5 text-xs text-left text-secondary hover:bg-accent hover:text-foreground rounded-lg flex items-center gap-2"
                        >
                          <Pencil className="w-3 h-3" />
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => handleDeleteFolder(folder.id)}
                          className="w-full px-2 py-1.5 text-xs text-left text-destructive hover:bg-destructive/10 rounded-lg flex items-center gap-2"
                        >
                          <Trash2 className="w-3 h-3" />
                          Xóa
                        </button>
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
      <main className="flex-1 bg-background rounded-md flex flex-col">
        {/* Top */}
        <ClassPageHeader title="Danh sách bài giảng" count={count}>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <TableSearch />
            {role === "teacher" && (
              <>
                <button
                  onClick={handleCreateFolder}
                  className="px-3.5 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-accent whitespace-nowrap transition-colors shadow-sm"
                >
                  Tạo thư mục
                </button>
                <Link
                  href={`/class/${classCode}/video/add`}
                  className="px-3.5 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary-hover whitespace-nowrap transition-colors shadow-sm"
                >
                  Tạo khóa học
                </Link>
              </>
            )}
          </div>
        </ClassPageHeader>

        {/* List */}
        <div className="flex-1 p-4">
          {data.length > 0 ? (
            <Table columns={columns} renderRow={renderRow} data={data} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
              <FolderOpen className="w-16 h-16 mb-4 text-muted-foreground/40" />
              <h3 className="text-xl font-semibold text-foreground">
                {activeFolderId
                  ? "Thư mục này trống"
                  : "Chưa có bài giảng nào"}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {role === "teacher"
                  ? "Hãy bắt đầu bằng cách tạo một khóa học mới."
                  : "Nội dung sẽ sớm được cập nhật."}
              </p>
              {role === "teacher" && (
                <Link
                  href={`/class/${classCode}/video/add`}
                  className="mt-6 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
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