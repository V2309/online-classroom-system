"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourse, updateCourse } from "@/lib/actions/file.action";
import { Course, Folder, Chapter, Video } from "@prisma/client";
import { X, Plus, Folder as FolderIcon, ChevronDown, Save } from "lucide-react";
import { toast } from "react-toastify";

// --- Định nghĩa các kiểu dữ liệu (Interfaces) ---

// Kiểu dữ liệu đầy đủ cho một khóa học để chỉnh sửa
type CourseWithChaptersAndVideos = Course & {
    chapters: (Chapter & {
        videos: Video[];
    })[];
};

interface CourseFormProps {
    classCode: string;
    folders: Folder[];
    course?: CourseWithChaptersAndVideos; // Prop `course` là tùy chọn, dùng cho chế độ chỉnh sửa
}

interface ChapterFormData {
    id: string; // Có thể là ID từ DB hoặc ID tạm thời (Date.now())
    title: string;
    description: string;
    orderIndex: number;
    videos: VideoFormData[];
}

interface VideoFormData {
    id: string; // Có thể là ID từ DB hoặc ID tạm thời
    title: string;
    description: string;
    url: string;
    duration: string;
    orderIndex: number;
}

export default function CourseForm({ classCode, folders, course }: CourseFormProps) {
    const router = useRouter();
    const isEditMode = !!course; // Xác định xem đây là form tạo mới hay chỉnh sửa

    // --- State và Logic xử lý ---
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state - Khởi tạo với dữ liệu của `course` nếu ở chế độ chỉnh sửa
    const [title, setTitle] = useState(course?.title || "");
    const [description, setDescription] = useState(course?.description || "");
    const [folderId, setFolderId] = useState<string | null>(course?.folderId || null);
    
    // Khởi tạo chapters và videos, đảm bảo các trường null/undefined được chuyển thành chuỗi rỗng
    const [chapters, setChapters] = useState<ChapterFormData[]>(
        course?.chapters.map(ch => ({
            ...ch,
            id: ch.id, // Sử dụng ID thật từ database
            description: ch.description || "",
            videos: ch.videos.map(v => ({
                ...v,
                id: v.id, // Sử dụng ID thật từ database
                duration: v.duration || "",
                description: v.description || ""
            }))
        })) || []
    );
    
    // Folder state
    const [allFolders, setAllFolders] = useState<Folder[]>(folders);
    const [showNewFolderForm, setShowNewFolderForm] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [newFolderDescription, setNewFolderDescription] = useState("");
    const [newFolderColor, setNewFolderColor] = useState("#6366F1");

    // --- Các hàm xử lý ---

    const addChapter = () => {
        const newChapter: ChapterFormData = {
            id: Date.now().toString(), // ID tạm thời cho chương mới
            title: ``,
            description: "",
            orderIndex: chapters.length,
            videos: []
        };
        setChapters([...chapters, newChapter]);
    };

    const removeChapter = (chapterId: string) => {
        setChapters(chapters.filter(c => c.id !== chapterId));
    };

    const updateChapter = (chapterId: string, field: keyof ChapterFormData, value: any) => {
        setChapters(chapters.map(chapter =>
            chapter.id === chapterId
                ? { ...chapter, [field]: value }
                : chapter
        ));
    };

    const addVideoToChapter = (chapterId: string) => {
        const newVideo: VideoFormData = {
            id: Date.now().toString(), // ID tạm thời cho video mới
            title: "",
            description: "",
            url: "",
            duration: "",
            orderIndex: 0
        };
        setChapters(chapters.map(chapter =>
            chapter.id === chapterId
                ? {
                    ...chapter,
                    videos: [...chapter.videos, { ...newVideo, orderIndex: chapter.videos.length }]
                }
                : chapter
        ));
    };

    const removeVideoFromChapter = (chapterId: string, videoId: string) => {
        setChapters(chapters.map(chapter =>
            chapter.id === chapterId
                ? { ...chapter, videos: chapter.videos.filter(v => v.id !== videoId) }
                : chapter
        ));
    };

    const updateVideo = (chapterId: string, videoId: string, field: keyof VideoFormData, value: any) => {
        setChapters(chapters.map(chapter =>
            chapter.id === chapterId
                ? {
                    ...chapter,
                    videos: chapter.videos.map(video =>
                        video.id === videoId
                            ? { ...video, [field]: value }
                            : video
                    )
                }
                : chapter
        ));
    };
    
    const handleCloseNewFolderForm = () => {
        setShowNewFolderForm(false);
        setNewFolderName("");
        setNewFolderDescription("");
        setNewFolderColor("#6366F1");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("classCode", classCode);

            if (folderId) {
                formData.append("folderId", folderId);
            }
            if (showNewFolderForm && newFolderName.trim()) {
                formData.append("newFolderName", newFolderName.trim());
                if (newFolderDescription.trim()) {
                    formData.append("newFolderDescription", newFolderDescription.trim());
                }
                formData.append("newFolderColor", newFolderColor);
            }
            
            // Re-order index before submitting
            const orderedChapters = chapters.map((chapter, chapterIndex) => ({
                ...chapter,
                orderIndex: chapterIndex,
                videos: chapter.videos.map((video, videoIndex) => ({
                    ...video,
                    orderIndex: videoIndex
                }))
            }));
            formData.append("chapters", JSON.stringify(orderedChapters));
            
            let result;
            if (isEditMode) {
                formData.append("courseId", course.id); // Thêm ID của khóa học để cập nhật
                result = await updateCourse({ success: false, error: false }, formData);
            } else {
                result = await createCourse({ success: false, error: false }, formData);
            }

            if (result.success) {
                toast.success(isEditMode ? "Cập nhật khóa học thành công" : "Tạo khóa học thành công");
                router.push(`/class/${classCode}/video`);
            } else {
                setError(result.error?.toString() || `Có lỗi xảy ra khi ${isEditMode ? 'cập nhật' : 'tạo'} khóa học`);
            }
        } catch (err) {
            console.error(err);
            setError(`Có lỗi xảy ra khi ${isEditMode ? 'cập nhật' : 'tạo'} khóa học`);
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- Giao diện JSX ---
    return (
        <div className="bg-slate-50 min-h-screen">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto py-12 px-4 space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-800">{isEditMode ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}</h1>
                    <p className="text-slate-500 mt-2">{isEditMode ? "Cập nhật thông tin và nội dung cho khóa học của bạn." : "Điền thông tin dưới đây để tạo một khóa học video mới."}</p>
                </div>

                {/* Card 1: Thông tin khóa học */}
                <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                    <h2 className="text-xl font-semibold text-slate-800 border-b pb-3">1. Thông tin khóa học</h2>
                    
                    {/* Tên khóa học */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Tên khóa học *</label>
                        <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="VD: Lập trình ReactJS cho người mới bắt đầu"/>
                    </div>

                    {/* Mô tả */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Giới thiệu ngắn gọn về khóa học..."/>
                    </div>

                    {/* Thư mục */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label htmlFor="folder" className="block text-sm font-medium text-slate-700">Thư mục</label>
                            <button type="button" onClick={() => setShowNewFolderForm(!showNewFolderForm)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                <Plus className="w-4 h-4" /> {showNewFolderForm ? "Hủy tạo mới" : "Tạo mới"}
                            </button>
                        </div>

                        {/* Form tạo thư mục mới */}
                        {showNewFolderForm && (
                            <div className="mb-4 p-4 border border-indigo-200 rounded-md bg-indigo-50 space-y-4 transition-all duration-300">
                                <h3 className="font-semibold text-indigo-800">Tạo thư mục mới</h3>
                                <input type="text" placeholder="Tên thư mục *" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md" />
                                <input type="text" placeholder="Mô tả (tùy chọn)" value={newFolderDescription} onChange={(e) => setNewFolderDescription(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md" />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-slate-600">Màu sắc:</label>
                                        <input type="color" value={newFolderColor} onChange={(e) => setNewFolderColor(e.target.value)} className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent" style={{ appearance: 'none' }}/>
                                    </div>
                                    <button type="button" onClick={handleCloseNewFolderForm} className="text-sm text-slate-500 hover:text-slate-700">Đóng</button>
                                </div>
                            </div>
                        )}
                        
                        {/* Dropdown chọn thư mục */}
                        <div className="relative">
                            <select id="folder" value={folderId || ""} onChange={(e) => setFolderId(e.target.value || null)} disabled={showNewFolderForm} className="w-full appearance-none px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed">
                                <option value="">-- Chọn thư mục có sẵn --</option>
                                {allFolders.map((folder) => (
                                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>
                
                {/* Card 2: Nội dung khóa học */}
                <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                    <div className="flex items-center justify-between border-b pb-3">
                        <h2 className="text-xl font-semibold text-slate-800">2. Nội dung khóa học</h2>
                        <button type="button" onClick={addChapter} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors">
                            <Plus className="w-4 h-4" /> Thêm chương
                        </button>
                    </div>
                    
                    {/* Danh sách các chương */}
                    <div className="space-y-6">
                        {chapters.map((chapter, chapterIndex) => (
                            <div key={chapter.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                                {/* Header của chương */}
                                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                                    <h3 className="font-semibold text-slate-800">Chương {chapterIndex + 1}</h3>
                                    <button type="button" onClick={() => removeChapter(chapter.id)} className="text-slate-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                                </div>
                                
                                {/* Form của chương */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" value={chapter.title} onChange={(e) => updateChapter(chapter.id, "title", e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" placeholder="Tên chương *"/>
                                    <input type="text" value={chapter.description} onChange={(e) => updateChapter(chapter.id, "description", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" placeholder="Mô tả chương"/>
                                </div>
                                
                                {/* Videos trong chapter */}
                                <div className="space-y-4 pt-4">
                                    {chapter.videos.map((video, videoIndex) => (
                                        <div key={video.id} className="bg-white p-3 rounded-md border space-y-3 relative">
                                            <button type="button" onClick={() => removeVideoFromChapter(chapter.id, video.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                            <p className="text-sm font-semibold text-slate-700">Video {videoIndex + 1}</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <input type="text" value={video.title} onChange={(e) => updateVideo(chapter.id, video.id, "title", e.target.value)} placeholder="Tên video *" className="w-full px-2 py-1.5 border rounded text-sm" required/>
                                                <input type="text" value={video.url} onChange={(e) => updateVideo(chapter.id, video.id, "url", e.target.value)} placeholder="URL YouTube *" className="w-full px-2 py-1.5 border rounded text-sm" required/>
                                                <input type="text" value={video.description} onChange={(e) => updateVideo(chapter.id, video.id, "description", e.target.value)} placeholder="Mô tả video" className="w-full px-2 py-1.5 border rounded text-sm"/>
                                                <input type="text" value={video.duration} onChange={(e) => updateVideo(chapter.id, video.id, "duration", e.target.value)} placeholder="Thời lượng (VD: 10:30)" className="w-full px-2 py-1.5 border rounded text-sm"/>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addVideoToChapter(chapter.id)} className="w-full text-sm px-3 py-2 bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 transition-colors">
                                        + Thêm video vào chương
                                    </button>
                                </div>
                            </div>
                        ))}

                        {chapters.length === 0 && (
                            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg text-slate-500">
                                <FolderIcon className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                <p className="font-semibold">Khóa học chưa có nội dung</p>
                                <p className="text-sm">Hãy bắt đầu bằng cách thêm chương đầu tiên.</p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Card 3: Actions */}
                <div className="bg-white p-4 rounded-lg shadow-md">
                    {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                    <div className="flex items-center justify-end gap-4">
                        <button type="button" onClick={() => router.back()} className="px-6 py-2 font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">Hủy</button>
                        <button type="submit" disabled={isLoading || !title.trim()} className="px-6 py-2 font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                            {isLoading ? "Đang xử lý..." : (isEditMode ? <> <Save className="w-4 h-4"/> Lưu thay đổi </> : <> <Plus className="w-4 h-4"/> Tạo khóa học </>)}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
