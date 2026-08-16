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
  Plus,
  Video as VideoIcon,
  FolderPlus,
  ArrowRightLeft,
  Sparkles,
} from "lucide-react";
import {
  CourseWithDetails,
  FolderWithCourseCount,
} from "@/app/(page)/class/[id]/video/page";
import { useState, useCallback } from "react";
import MoveCourseModal from "@/components/modals/MoveCourseModal";
import { courseService } from "@/services/course.service";
import { toast } from "react-toastify";

const dateFormatter = new Intl.DateTimeFormat("vi-VN");
const formatDate = (date: Date) => dateFormatter.format(new Date(date));

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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [folderFormType, setFolderFormType] = useState<"create" | "update">("create");
  const [folderFormData, setFolderFormData] = useState<any>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [courseToMove, setCourseToMove] = useState<CourseWithDetails | null>(null);

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
    { header: "Thao tác", accessor: "action" },
  ];

  const handleOpenMenu = useCallback((id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  }, []);

  const handleOpenFolderMenu = useCallback((id: string) => {
    setOpenFolderMenuId((prev) => (prev === id ? null : id));
  }, []);

  const handleFormSuccess = useCallback(() => {
    router.refresh();
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
        color: folder.color || "#2b5938",
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
        toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xóa khóa học.");
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
        toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xóa thư mục.");
      }
    },
    [router]
  );

  const handleOpenMoveModal = useCallback((course: CourseWithDetails) => {
    setCourseToMove(course);
    setShowMoveModal(true);
    setOpenMenuId(null);
  }, []);

  const renderRow = useCallback(
    (course: CourseWithDetails) => (
      <tr key={course.id} className="border-b border-border/70 hover:bg-muted/40 transition-colors">
        {/* Tên bài giảng */}
        <td className="p-3.5 sm:p-4">
          <Link
            href={`/class/${classCode}/video/${course.id}`}
            className="flex items-center gap-3.5 group"
          >
            <div className="relative w-16 sm:w-20 h-11 sm:h-12 overflow-hidden rounded-2xl bg-card border border-border flex-shrink-0 shadow-2xs">
              {course.thumbnailUrl ? (
                <Image
                  path={course.thumbnailUrl}
                  alt={course.title}
                  w={80}
                  h={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-accent flex items-center justify-center text-primary">
                  <Play className="w-5 h-5 fill-primary text-primary" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-heading font-bold text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {course.title}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                <span className="font-bold text-primary">{course._count?.videos || 0} videos</span>
                {course.folder && <span>•</span>}
                {course.folder && <span className="truncate">{course.folder.name}</span>}
              </p>
            </div>
          </Link>
        </td>

        {/* Trạng thái */}
        <td className="hidden md:table-cell p-3.5 sm:p-4">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
              course.isActive
                ? "bg-accent text-primary border border-primary/20"
                : "bg-muted text-secondary"
            }`}
          >
            {course.isActive ? "Đang mở" : "Đã ẩn"}
          </span>
        </td>

        {/* Ngày tạo */}
        <td className="hidden lg:table-cell p-3.5 sm:p-4">
          <time dateTime={new Date(course.createdAt).toISOString()} className="text-xs text-muted-foreground font-medium">
            {formatDate(new Date(course.createdAt))}
          </time>
        </td>

        {/* Actions */}
        <td className="p-3.5 sm:p-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => handleOpenMenu(course.id)}
              className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {openMenuId === course.id && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-xl border border-border py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                <Link
                  href={`/class/${classCode}/video/${course.id}`}
                  className="px-3.5 py-2 flex items-center gap-2.5 w-full text-left text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem chi tiết</span>
                </Link>

                {role === "teacher" && (
                  <>
                    <Link
                      href={`/class/${classCode}/video/${course.id}/edit`}
                      className="px-3.5 py-2 flex items-center gap-2.5 w-full text-left text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleOpenMoveModal(course)}
                      className="px-3.5 py-2 flex items-center gap-2.5 w-full text-left text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Di chuyển</span>
                    </button>
                    <div className="border-t border-border my-1" />
                    <button
                      type="button"
                      onClick={() => handleDeleteCourse(course.id)}
                      className="px-3.5 py-2 flex items-center gap-2.5 w-full text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa bài giảng</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </td>
      </tr>
    ),
    [classCode, role, openMenuId, handleOpenMenu, handleOpenMoveModal, handleDeleteCourse]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full min-h-0 w-full overflow-hidden text-foreground">
      {/* ── CỘT 1: THƯ MỤC BÀI GIẢNG (BÊN TRÁI) ── */}
      <aside className="w-full lg:w-64 xl:w-72 bg-white rounded-3xl border border-border shadow-sm p-4 sm:p-5 flex flex-col flex-shrink-0 overflow-hidden">
        {/* Header Thư mục */}
        <div className="flex items-center justify-between pb-3 border-b border-border/80 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-bold text-foreground text-sm">Thư mục</h3>
          </div>

          {role === "teacher" && (
            <button
              type="button"
              onClick={handleCreateFolder}
              className="p-1.5 rounded-xl bg-accent text-primary hover:bg-accent/80 transition-all shadow-2xs cursor-pointer"
              title="Tạo thư mục mới"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Danh sách folder */}
        <nav className="flex-1 overflow-y-auto space-y-1.5 pt-3 scrollbar-thin min-h-0">
          {/* Mục Tất cả */}
          <Link
            href={`/class/${classCode}/video`}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
              !activeFolderId
                ? "bg-accent text-primary shadow-2xs font-bold"
                : "text-secondary hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <FolderOpen className="w-4 h-4" />
              <span>Tất cả bài giảng</span>
            </div>
            <span className="text-xs bg-white text-secondary px-2 py-0.5 rounded-full border border-border/60">
              {allCoursesCount}
            </span>
          </Link>

          {/* Các thư mục tùy chỉnh */}
          {folders.map((folder) => (
            <div key={folder.id} className="relative group flex items-center justify-between">
              <Link
                href={`/class/${classCode}/video?folderId=${folder.id}`}
                className={`flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                  activeFolderId === folder.id
                    ? "bg-accent text-primary shadow-2xs font-bold"
                    : "text-secondary hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Folder className="w-4 h-4 text-primary" style={{ color: folder.color || undefined }} />
                  <span className="truncate">{folder.name}</span>
                </div>
                <span className="text-xs bg-white text-secondary px-2 py-0.5 rounded-full border border-border/60">
                  {folder._count?.courses || 0}
                </span>
              </Link>

              {/* Menu folder cho giáo viên */}
              {role === "teacher" && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => handleOpenFolderMenu(folder.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-xl hover:bg-muted mr-1"
                  >
                    <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  {openFolderMenuId === folder.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-2xl shadow-lg border border-border py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        type="button"
                        onClick={() => handleEditFolder(folder)}
                        className="w-full px-3.5 py-2 text-xs font-semibold text-left text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="w-full px-3.5 py-2 text-xs font-semibold text-left text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── CỘT 2: DANH SÁCH KHÓA HỌC BÀI GIẢNG (BÊN PHẢI) ── */}
      <main className="flex-1 bg-white rounded-3xl border border-border shadow-sm p-4 sm:p-6 flex flex-col min-h-0 overflow-hidden">
        {/* Top Header Card tích hợp */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent text-primary flex items-center justify-center shadow-2xs flex-shrink-0">
              <VideoIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-heading font-bold text-foreground">
                  Bài giảng video
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent text-primary">
                  {count} khóa học
                </span>
              </div>
              <p className="text-[11px] text-secondary mt-0.5">
                Các bài giảng ghi hình và tài liệu học tập
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-stretch sm:self-auto justify-between sm:justify-end">
            <div className="w-full sm:w-60">
              <TableSearch />
            </div>

            {role === "teacher" && (
              <Link
                href={`/class/${classCode}/video/add`}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-2xl text-xs sm:text-sm shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo khóa học</span>
              </Link>
            )}
          </div>
        </div>

        {/* Danh sách table cuộn nội bộ */}
        <div className="flex-1 overflow-y-auto pt-3 min-h-0 scrollbar-thin">
          {data.length > 0 ? (
            <Table columns={columns} renderRow={renderRow} data={data} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
              <div className="w-14 h-14 rounded-3xl bg-accent text-primary flex items-center justify-center mb-3 shadow-2xs">
                <VideoIcon className="w-7 h-7" />
              </div>
              <h3 className="text-base font-heading font-bold text-foreground">
                {activeFolderId ? "Thư mục này hiện chưa có bài giảng" : "Chưa có bài giảng nào trong lớp"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {role === "teacher"
                  ? "Bắt đầu đăng tải các bài giảng video mới để học sinh có thể tự ôn tập."
                  : "Nội dung bài giảng sẽ sớm được giáo viên cập nhật."}
              </p>
              {role === "teacher" && (
                <Link
                  href={`/class/${classCode}/video/add`}
                  className="mt-5 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-2xl text-xs sm:text-sm shadow-xs hover:bg-primary-hover transition-all"
                >
                  Tạo khóa học mới
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Phân trang */}
        <div className="pt-3 border-t border-border/80 flex-shrink-0">
          {data.length > 0 && <Pagination page={page} count={count} />}
        </div>
      </main>

      {/* Modal tạo thư mục */}
      {showFolderForm && (
        <FolderForm
          type={folderFormType}
          data={folderFormData}
          classCode={classCode}
          setOpen={setShowFolderForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Modal di chuyển */}
      {showMoveModal && courseToMove && (
        <MoveCourseModal
          isOpen={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          courseId={courseToMove.id}
          currentFolderId={courseToMove.folderId || null}
          folders={folders}
          classCode={classCode}
          onSuccess={() => {
            handleFormSuccess();
            setShowMoveModal(false);
          }}
        />
      )}
    </div>
  );
}