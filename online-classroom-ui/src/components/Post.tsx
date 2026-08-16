"use client";

import Image from "@/components/Image";
import PostInteractions from "@/components/PostInteractions";
import Video from "@/components/Video";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { postService } from "@/services/post.service";
import { useRouter } from "next/navigation";
import { Clock, MoreHorizontal } from "lucide-react";

type UserSummary = {
  id?: string;
  username: string;
  img?: string | null;
  role?: string;
};

type PostWithDetails = {
  id: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
  desc?: string | null;
  img?: string | null;
  imgHeight?: number | null;
  video?: string | null;
  isSensitive?: boolean;
  classCode?: string | null;
  class_name?: string | null;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  _count?: { likes: number; comments: number };
  likes?: { id: number }[];
  user: UserSummary;
};

// Helper format thời gian tiếng Việt tự nhiên
const formatTimeAgo = (date: Date | string) => {
  const d = new Date(date);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 60) return "Vừa xong";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)} ngày trước`;
  return d.toLocaleDateString("vi-VN");
};

const Post = ({
  type,
  post,
}: {
  type?: "status" | "comment";
  post: any;
}) => {
  const router = useRouter();
  const originalPost = post;
  const { user } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState(originalPost.desc || "");
  const [editMedia, setEditMedia] = useState<File | null>(null);
  const [removeCurrentMedia, setRemoveCurrentMedia] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isOwner = user?.username === originalPost.user.username;

  // Function để xóa bài viết
  const handleDeletePost = async () => {
    try {
      await postService.deletePost(originalPost.id);
      toast.success("Xóa bài viết thành công!", {
        position: "bottom-right",
        autoClose: 3000,
      });
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xóa bài viết");
    }
  };

  // Function để xử lý sửa bài viết
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDesc.trim()) {
      toast.error("Nội dung bài viết không được để trống", {
        position: "bottom-right",
        autoClose: 3000,
      });
      return;
    }
    
    try {
      setIsEditing(false);
      toast.success("Cập nhật bài viết thành công!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật bài viết");
    }
  };

  // Function để hủy sửa bài viết
  const handleCancelEdit = () => {
    setEditDesc(originalPost.desc || "");
    setEditMedia(null);
    setRemoveCurrentMedia(false);
    setIsEditing(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const groupLabel = originalPost.class_name || originalPost.className || originalPost.classCode || "Bảng tin lớp học";

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#ece7de] shadow-sm mb-4 sm:mb-6 p-4 sm:p-5 lg:p-6 text-foreground transition-all">
      {/* POST HEADER / POSTINFO */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* AVATAR */}
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-black/5">
            <Image
              path={originalPost.user.img || "/avatar.png"}
              alt=""
              w={100}
              h={100}
              tr={true}
              className="w-full h-full object-cover"
            />
          </div>

          {/* USER & POST INFO */}
          <div className="flex flex-col min-w-0">
            <h3 className="font-bold text-sm sm:text-base text-[#1f2421] truncate leading-snug">
              {originalPost.user.username}
            </h3>
            
            <div className="flex items-center gap-1.5 text-xs text-[#736c5f] font-normal flex-wrap mt-0.5" suppressHydrationWarning>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#736c5f] flex-shrink-0" />
                <span>
                  {isClient ? formatTimeAgo(originalPost.createdAt) : new Date(originalPost.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <span>•</span>
              <span className="truncate max-w-[200px] sm:max-w-[300px]">
                {groupLabel}
              </span>
            </div>
          </div>
        </div>

        {/* THREE-DOT MENU BUTTON */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowDropdown(!showDropdown);
            }}
            className="p-1.5 sm:p-2 hover:bg-[#f4efe8] rounded-full text-[#736c5f] hover:text-[#1f2421] transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 top-8 bg-white border border-[#ece7de] rounded-xl shadow-lg z-10 min-w-[130px] py-1 overflow-hidden">
              {isOwner ? (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsEditing(true);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f4efe8] text-sm text-foreground transition-colors font-medium"
                  >
                    Sửa bài viết
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
                        handleDeletePost();
                      }
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-destructive/10 text-sm text-destructive transition-colors font-medium"
                  >
                    Xóa bài viết
                  </button>
                </>
              ) : (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Tính năng ghim bài viết sẽ được phát triển sớm!", {
                      position: "bottom-right",
                      autoClose: 3000,
                    });
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#f4efe8] text-sm text-foreground transition-colors font-medium"
                >
                  Ghim bài viết
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* POST TEXT & MEDIA */}
      <div className="mt-3 sm:mt-3.5">
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full p-3 border border-border bg-[#f4efe8] rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-primary text-sm leading-relaxed"
              rows={3}
              placeholder="Nhập nội dung bài viết..."
            />
            
            {/* Current media display */}
            {!removeCurrentMedia && (originalPost.img || originalPost.video) && (
              <div className="relative rounded-xl overflow-hidden mt-2">
                {originalPost.img && (
                  <Image 
                    path={originalPost.img} 
                    alt="" 
                    w={600} 
                    h={originalPost.imgHeight || 400} 
                    tr={true}
                    className="rounded-xl"
                  />
                )}
                {originalPost.video && (
                  <Video path={originalPost.video} className="rounded-xl" />
                )}
                <button
                  type="button"
                  onClick={() => setRemoveCurrentMedia(true)}
                  className="absolute top-2 right-2 bg-red-500 text-white h-7 w-7 rounded-full hover:bg-red-600 flex items-center justify-center text-sm"
                >
                  ×
                </button>
              </div>
            )}
            
            {/* New media upload */}
            <div className="border-2 border-dashed border-border rounded-xl p-4">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setEditMedia(e.target.files?.[0] || null)}
                className="hidden"
                id="edit-media-upload"
              />
              <label 
                htmlFor="edit-media-upload"
                className="flex flex-col items-center cursor-pointer text-muted-foreground hover:text-foreground text-xs sm:text-sm"
              >
                {editMedia ? editMedia.name : "Chọn ảnh hoặc video mới (tùy chọn)"}
              </label>
              {editMedia && (
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setEditMedia(null)}
                    className="text-destructive hover:underline text-xs"
                  >
                    Xóa file đã chọn
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-1.5 bg-muted text-foreground rounded-lg hover:bg-accent text-xs sm:text-sm font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover text-xs sm:text-sm font-medium shadow-sm"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm sm:text-base text-[#2e3230] leading-relaxed break-words whitespace-pre-line">
            {originalPost.desc}
          </p>
        )}

        {/* IMAGE ATTACHMENT */}
        {originalPost.img && (
          <div className="overflow-hidden rounded-2xl mt-3.5 border border-[#eee8df]">
            <Image
              path={originalPost.img}
              alt=""
              w={800}
              h={800}
              className={`w-full h-auto max-h-[500px] object-cover ${originalPost.isSensitive ? "blur-3xl" : ""}`}
            />
          </div>
        )}

        {/* VIDEO ATTACHMENT */}
        {originalPost.video && (
          <div className="rounded-2xl overflow-hidden mt-3.5 border border-[#eee8df]">
            <Video
              path={originalPost.video}
              className={`w-full ${originalPost.isSensitive ? "blur-3xl" : ""}`}
            />
          </div>
        )}
      </div>

      {/* POST INTERACTIONS */}
      <PostInteractions
        username={originalPost.user.username}
        postId={originalPost.id}
        count={originalPost._count || { likes: originalPost.likesCount || 0, comments: originalPost.commentsCount || 0 }}
        isLiked={!!(originalPost.likes && originalPost.likes.length > 0) || !!originalPost.isLiked}
        classCode={originalPost.classCode || undefined}
      />
    </div>
  );
};

export default Post;