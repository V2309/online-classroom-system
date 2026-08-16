"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { courseService } from "@/services/course.service";
import { CourseItem, FolderItem, ChapterItem, VideoItem } from "@/types/course";
import { X, Plus, Folder as FolderIcon, ChevronDown, Save, Film, BookOpen, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

type CourseWithChaptersAndVideos = CourseItem & {
  chapters?: ChapterItem[];
};

interface CourseFormProps {
  classCode: string;
  folders: FolderItem[];
  course?: CourseWithChaptersAndVideos;
}

interface ChapterFormData {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  videos: VideoFormData[];
}

interface VideoFormData {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: string;
  orderIndex: number;
}

export default function CourseForm({ classCode, folders, course }: CourseFormProps) {
  const router = useRouter();
  const isEditMode = !!course;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(course?.title || "");
  const [description, setDescription] = useState(course?.description || "");
  const [folderId, setFolderId] = useState<string | null>(course?.folderId || null);

  const [chapters, setChapters] = useState<ChapterFormData[]>(
    course?.chapters?.map((ch) => ({
      ...ch,
      id: ch.id,
      description: ch.description || "",
      videos:
        ch.videos?.map((v) => ({
          ...v,
          id: v.id,
          duration: v.duration || "",
          description: v.description || "",
        })) || [],
    })) || []
  );

  const [allFolders, setAllFolders] = useState<FolderItem[]>(folders);
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#2b5938");

  const addChapter = () => {
    const newChapter: ChapterFormData = {
      id: Date.now().toString(),
      title: "",
      description: "",
      orderIndex: chapters.length,
      videos: [],
    };
    setChapters([...chapters, newChapter]);
  };

  const removeChapter = (chapterId: string) => {
    setChapters(chapters.filter((c) => c.id !== chapterId));
  };

  const updateChapter = (chapterId: string, field: keyof ChapterFormData, value: any) => {
    setChapters(
      chapters.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, [field]: value } : chapter
      )
    );
  };

  const addVideoToChapter = (chapterId: string) => {
    setChapters(
      chapters.map((chapter) => {
        if (chapter.id === chapterId) {
          const newVideo: VideoFormData = {
            id: Date.now().toString(),
            title: "",
            description: "",
            url: "",
            duration: "",
            orderIndex: chapter.videos.length,
          };
          return {
            ...chapter,
            videos: [...chapter.videos, newVideo],
          };
        }
        return chapter;
      })
    );
  };

  const removeVideoFromChapter = (chapterId: string, videoId: string) => {
    setChapters(
      chapters.map((chapter) =>
        chapter.id === chapterId
          ? { ...chapter, videos: chapter.videos.filter((v) => v.id !== videoId) }
          : chapter
      )
    );
  };

  const updateVideo = (
    chapterId: string,
    videoId: string,
    field: keyof VideoFormData,
    value: any
  ) => {
    setChapters(
      chapters.map((chapter) =>
        chapter.id === chapterId
          ? {
              ...chapter,
              videos: chapter.videos.map((video) =>
                video.id === videoId ? { ...video, [field]: value } : video
              ),
            }
          : chapter
      )
    );
  };

  const handleCloseNewFolderForm = () => {
    setShowNewFolderForm(false);
    setNewFolderName("");
    setNewFolderDescription("");
    setNewFolderColor("#2b5938");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const orderedChapters = chapters.map((chapter, chapterIndex) => ({
        title: chapter.title,
        description: chapter.description || undefined,
        orderIndex: chapterIndex,
        videos: chapter.videos.map((video, videoIndex) => ({
          title: video.title,
          url: video.url,
          description: video.description || undefined,
          duration: video.duration || undefined,
          orderIndex: videoIndex,
        })),
      }));

      const payload = {
        title,
        description,
        classCode,
        folderId: folderId || undefined,
        chapters: orderedChapters,
        newFolderName:
          showNewFolderForm && newFolderName.trim() ? newFolderName.trim() : undefined,
        newFolderDescription:
          showNewFolderForm && newFolderDescription.trim()
            ? newFolderDescription.trim()
            : undefined,
        newFolderColor: showNewFolderForm ? newFolderColor : undefined,
      };

      if (isEditMode) {
        await courseService.updateCourse(course.id, payload);
      } else {
        await courseService.createCourse(payload);
      }

      toast.success(isEditMode ? "Cập nhật khóa học thành công" : "Tạo khóa học thành công");
      router.push(`/class/${classCode}/video`);
    } catch (err: any) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        `Có lỗi xảy ra khi ${isEditMode ? "cập nhật" : "tạo"} khóa học`;
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── CARD 1: THÔNG TIN KHÓA HỌC ── */}
      <div className="bg-white rounded-3xl border border-border shadow-sm p-6 sm:p-7 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-border/80">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-base sm:text-lg font-heading font-bold text-foreground">
            1. Thông tin chung về khóa học
          </h2>
        </div>

        {/* Tên khóa học */}
        <div>
          <label htmlFor="title" className="block text-xs font-bold text-foreground mb-1.5">
            Tên khóa học bài giảng <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-3 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground text-xs sm:text-sm font-medium transition-all"
            placeholder="VD: Lập trình Web nâng cao, Chuyên đề Hình học không gian..."
          />
        </div>

        {/* Mô tả */}
        <div>
          <label htmlFor="description" className="block text-xs font-bold text-foreground mb-1.5">
            Mô tả giới thiệu
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground text-xs sm:text-sm font-medium transition-all resize-none"
            placeholder="Mô tả mục tiêu, kiến thức sẽ đạt được sau khóa học..."
          />
        </div>

        {/* Thư mục */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="folder" className="block text-xs font-bold text-foreground">
              Phân loại Thư mục
            </label>
            <button
              type="button"
              onClick={() => setShowNewFolderForm(!showNewFolderForm)}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showNewFolderForm ? "Hủy tạo mới" : "Tạo thư mục mới"}</span>
            </button>
          </div>

          {/* Form tạo thư mục mới inline */}
          {showNewFolderForm && (
            <div className="mb-4 p-4 border border-primary/30 rounded-2xl bg-accent/30 space-y-3">
              <h3 className="font-bold text-primary text-xs sm:text-sm">Tạo thư mục mới</h3>
              <input
                type="text"
                placeholder="Tên thư mục *"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-border rounded-xl"
              />
              <input
                type="text"
                placeholder="Mô tả thư mục (tùy chọn)"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-border rounded-xl"
              />
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-foreground">Màu đại diện:</label>
                  <input
                    type="color"
                    value={newFolderColor}
                    onChange={(e) => setNewFolderColor(e.target.value)}
                    className="w-7 h-7 p-0 border-none rounded-full cursor-pointer bg-transparent"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCloseNewFolderForm}
                  className="text-xs font-semibold text-secondary hover:text-foreground cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}

          {/* Dropdown chọn thư mục */}
          <div className="relative">
            <select
              id="folder"
              value={folderId || ""}
              onChange={(e) => setFolderId(e.target.value || null)}
              disabled={showNewFolderForm}
              className="w-full appearance-none px-4 py-3 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground text-xs sm:text-sm font-medium disabled:opacity-50 cursor-pointer"
            >
              <option value="">-- Chọn thư mục có sẵn --</option>
              {allFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── CARD 2: NỘI DUNG CHƯƠNG VÀ VIDEO BÀI GIẢNG ── */}
      <div className="bg-white rounded-3xl border border-border shadow-sm p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border/80 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-primary" />
            <h2 className="text-base sm:text-lg font-heading font-bold text-foreground">
              2. Nội dung các chương học & Video bài giảng
            </h2>
          </div>
          <button
            type="button"
            onClick={addChapter}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent/80 text-primary text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm chương mới</span>
          </button>
        </div>

        {/* Danh sách các chương */}
        <div className="space-y-5">
          {chapters.map((chapter, chapterIndex) => (
            <div
              key={chapter.id}
              className="bg-card rounded-2xl border border-border p-4 sm:p-5 space-y-4 shadow-2xs"
            >
              {/* Header chương */}
              <div className="flex items-center justify-between pb-2 border-b border-border/70">
                <span className="font-heading font-bold text-foreground text-sm sm:text-base">
                  Chương {chapterIndex + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeChapter(chapter.id)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                  title="Xóa chương này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Tên chương & Mô tả */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={chapter.title}
                  onChange={(e) => updateChapter(chapter.id, "title", e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-border rounded-xl text-xs sm:text-sm font-medium"
                  placeholder="Tên chương học *"
                />
                <input
                  type="text"
                  value={chapter.description}
                  onChange={(e) => updateChapter(chapter.id, "description", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-border rounded-xl text-xs sm:text-sm font-medium"
                  placeholder="Mô tả chương (tùy chọn)"
                />
              </div>

              {/* Danh sách video trong chương */}
              <div className="space-y-3 pt-2">
                {chapter.videos.map((video, videoIndex) => (
                  <div
                    key={video.id}
                    className="bg-white p-3.5 rounded-2xl border border-border/80 space-y-2.5 relative shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5" />
                        <span>Video {videoIndex + 1}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => removeVideoFromChapter(chapter.id, video.id)}
                        className="p-1 text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                        title="Xóa video"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={video.title}
                        onChange={(e) => updateVideo(chapter.id, video.id, "title", e.target.value)}
                        placeholder="Tiêu đề video *"
                        className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm font-medium"
                        required
                      />
                      <input
                        type="text"
                        value={video.url}
                        onChange={(e) => updateVideo(chapter.id, video.id, "url", e.target.value)}
                        placeholder="Đường dẫn link YouTube *"
                        className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm font-medium"
                        required
                      />
                      <input
                        type="text"
                        value={video.description}
                        onChange={(e) =>
                          updateVideo(chapter.id, video.id, "description", e.target.value)
                        }
                        placeholder="Mô tả tóm tắt nội dung"
                        className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm font-medium"
                      />
                      <input
                        type="text"
                        value={video.duration}
                        onChange={(e) =>
                          updateVideo(chapter.id, video.id, "duration", e.target.value)
                        }
                        placeholder="Thời lượng (VD: 15:30)"
                        className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm font-medium"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addVideoToChapter(chapter.id)}
                  className="w-full py-2.5 bg-white hover:bg-muted text-secondary font-semibold rounded-2xl border border-dashed border-border transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm video vào chương {chapterIndex + 1}</span>
                </button>
              </div>
            </div>
          ))}

          {chapters.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl text-muted-foreground p-6">
              <FolderIcon className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
              <p className="font-bold text-sm text-foreground">Khóa học chưa có chương nào</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nhấn vào nút "Thêm chương mới" để bắt đầu thêm các bài giảng video.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── CARD 3: HÀNH ĐỘNG SUBMIT ── */}
      <div className="bg-white rounded-3xl border border-border shadow-sm p-4 sm:p-5 flex items-center justify-end gap-3">
        {error && <p className="text-rose-600 text-xs font-semibold mr-auto">{error}</p>}
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 font-semibold text-secondary bg-card hover:bg-muted border border-border rounded-2xl transition-all text-xs sm:text-sm cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          disabled={isLoading || !title.trim()}
          className="px-6 py-2.5 font-bold bg-primary text-primary-foreground hover:bg-primary-hover rounded-2xl shadow-xs transition-all flex items-center gap-2 text-xs sm:text-sm cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            "Đang xử lý..."
          ) : isEditMode ? (
            <>
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Tạo khóa học</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
