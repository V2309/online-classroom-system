"use client";
import Image from "@/components/Image";
import PostInteractions from "@/components/PostInteractions";
import Video from "@/components/Video";
import Link from "next/link";
import {Post as PostType } from "@prisma/client";
import { format } from "timeago.js";
import { useUser } from "@/hooks/useUser";
import { useState, useEffect, useRef } from "react";
import { deletePost, updatePost } from "@/lib/actions/post.action";
import { toast } from "react-toastify";
import { useFormState } from "react-dom";

type UserSummary = {
  username: string;
  img: string | null;
};

type Engagement = {
  _count: { likes: number; comments: number };
  likes: { id: number }[];
};

type PostWithDetails = PostType &
  Engagement & {
    user: UserSummary;
  };

const Post = ({
  type,
  post,
}: {
  type?: "status" | "comment";
  post: PostWithDetails;
}) => {
  const originalPost = post;
  const { user } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState(originalPost.desc || "");
  const [editMedia, setEditMedia] = useState<File | null>(null);
  const [removeCurrentMedia, setRemoveCurrentMedia] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [editState, editFormAction] = useFormState(updatePost, {
    success: false,
    error: false,
  });
  
  const isOwner = user?.username === originalPost.user.username;

  // Function để hiển thị confirmation toast
  const handleDeletePost = async () => {
    try {
      // Hiển thị toast loading
     // const loadingToast = toast.loading("Đang xóa bài viết...");
      
      const result = await deletePost(originalPost.id);
      
      // Dismiss loading toast
    //  toast.dismiss(loadingToast);
      
      if (result.success) {
        // Hiển thị toast thành công
        toast.success("Xóa bài viết thành công!", {
          position: "bottom-right",
          autoClose: 3000,
        });
        
        // Reload trang sau một chút để user thấy toast
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
         console.error("Error deleting post:");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      // toast.error("Có lỗi xảy ra khi xóa bài viết", {
      //   position: "bottom-right",
      //   autoClose: 5000,
      // });
    }
  };

  // Function để xử lý sửa bài viết
  const handleEditSubmit = (formData: FormData) => {
    if (!editDesc.trim()) {
      toast.error("Nội dung bài viết không được để trống", {
        position: "bottom-right",
        autoClose: 3000,
      });
      return;
    }
    
    // Thêm các field cần thiết vào formData
    formData.append("postId", originalPost.id.toString());
    formData.append("desc", editDesc.trim());
    formData.append("removeMedia", removeCurrentMedia.toString());
    
    if (editMedia) {
      formData.append("file", editMedia);
    }
    
    editFormAction(formData);
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

  // Handle edit state changes
  useEffect(() => {
    if (editState.success) {
      toast.success("Cập nhật bài viết thành công!", {
        position: "bottom-right",
        autoClose: 3000,
      });
      setIsEditing(false);
      setEditMedia(null);
      setRemoveCurrentMedia(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    if (editState.error) {
      toast.error("Có lỗi xảy ra khi cập nhật bài viết", {
        position: "bottom-right",
        autoClose: 5000,
      });
    }
  }, [editState]);

  // Handle client-side rendering for time display
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6 border p-3 sm:p-4 lg:p-6">
   
      {/* POST CONTENT */}
      <div className={`flex gap-3 sm:gap-4 ${type === "status" && "flex-col"}`}>
        {/* AVATAR */}

        <div
          className={`${
            type === "status" && "hidden"
          } relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0`}
        >
          <Image
            path={originalPost.user.img || "/avatar.png"}
            alt=""
            w={100}
            h={100}
            tr={true}
          />
        </div>

        {/* CONTENT */}
        <div className="flex-1 flex flex-col gap-2 sm:gap-3 min-w-0">
          {/* TOP */}
          <div className="w-full flex justify-between items-start">
            <Link
              href="#"
              className="flex gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0"
            >
              <div
                className={`${
                  type !== "status" && "hidden"
                } relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0`}
              >
                <Image
                  path={originalPost.user.img || "/avatar.png"}
                  alt=""
                  w={100}
                  h={100}
                  tr={true}
                />
              </div>
              <div
                className={`flex items-center gap-2 flex-wrap min-w-0 ${
                  type === "status" && "flex-col gap-0 !items-start"
                }`}
              >
                <h1 className="text-sm sm:text-base font-bold truncate">
                  {originalPost.user.username}
                </h1>
                
                {type !== "status" && (
                  <span className="text-gray-500 text-xs sm:text-sm flex-shrink-0" suppressHydrationWarning>
                    {isClient ? format(originalPost.createdAt) : new Date(originalPost.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </Link>
            
            {/* Three-dot menu */}
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowDropdown(!showDropdown);
                }}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5"
                >
                  <circle cx="12" cy="5" r="2" fill="currentColor"/>
                  <circle cx="12" cy="12" r="2" fill="currentColor"/>
                  <circle cx="12" cy="19" r="2" fill="currentColor"/>
                </svg>
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                  {isOwner ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setIsEditing(true);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
                            handleDeletePost();
                          }
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600"
                      >
                        Xóa
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        // Handle pin - placeholder for future implementation
                        toast.info("Tính năng ghim bài viết sẽ được phát triển sớm!", {
                          position: "bottom-right",
                          autoClose: 3000,
                        });
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                    >
                      Ghim
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
          {/* TEXT & MEDIA */}
          {isEditing ? (
            <form action={handleEditSubmit} className="space-y-3">
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Nhập nội dung bài viết..."
              />
              
              {/* Current media display */}
              {!removeCurrentMedia && (originalPost.img || originalPost.video) && (
                <div className="relative">
                  {originalPost.img && (
                    <Image 
                      path={originalPost.img} 
                      alt="" 
                      w={600} 
                      h={originalPost.imgHeight || 400} 
                      tr={true}
                      className="rounded-lg"
                    />
                  )}
                  {originalPost.video && (
                    <Video path={originalPost.video} className="rounded-lg" />
                  )}
                  <button
                    type="button"
                    onClick={() => setRemoveCurrentMedia(true)}
                    className="absolute top-2 right-2 bg-red-500 text-white h-8 w-8 rounded-full hover:bg-red-600 flex items-center justify-center text-sm"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    Ảnh/Video hiện tại
                  </div>
                </div>
              )}
              
              {/* New media upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setEditMedia(e.target.files?.[0] || null)}
                  className="hidden"
                  id="edit-media-upload"
                />
                <label 
                  htmlFor="edit-media-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <div className="text-gray-500 text-center">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {editMedia ? editMedia.name : "Chọn ảnh hoặc video mới (tùy chọn)"}
                  </div>
                </label>
                {editMedia && (
                  <div className="mt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setEditMedia(null)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Xóa file đã chọn
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <Link
              href=""
            >
              <p className={`text-sm sm:text-base ${type === "status" && "sm:text-lg"} break-words`}>
                {originalPost.desc}
              </p>
            </Link>
          )}
          {originalPost.img && (
            <div className="overflow-hidden rounded-lg">
              <Image
                path={originalPost.img}
                alt=""
                w={600}
                h={ 600}
                className={`w-full h-auto max-h-96 sm:max-h-[500px] object-cover ${originalPost.isSensitive ? "blur-3xl" : ""}`}
              />
            </div>
          )}
          {originalPost.video && (
            <div className="rounded-lg overflow-hidden">
              <Video
                path={originalPost.video}
                className={`w-full ${originalPost.isSensitive ? "blur-3xl" : ""}`}
              />
            </div>
          )}
          {type === "status" && (
            <span className="text-textGray">8:41 PM · Dec 5, 2024</span>
          )}
          <PostInteractions
            username={originalPost.user.username}
            postId={originalPost.id}
            count={originalPost._count}
            isLiked={!!originalPost.likes.length}
            classCode={originalPost.classCode || undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default Post;