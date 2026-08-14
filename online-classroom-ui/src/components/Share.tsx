"use client";

import React, { useState } from "react";
import Image from "./Image";
import NextImage from "next/image";
import ImageEditor from "@/components/ImageEditor";
import { uploadService } from "@/services/upload.service";
import { postService } from "@/services/post.service";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const Share = ({ classCode, userImg }: { classCode: string; userImg?: string }) => {
  const router = useRouter();
  const [desc, setDesc] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [settings, setSettings] = useState<{
    type: "original" | "wide" | "square";
    sensitive: boolean;
  }>({
    type: "original",
    sensitive: false,
  });

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMedia(e.target.files[0]);
    }
  };

  const previewURL = media ? URL.createObjectURL(media) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) {
      toast.error("Vui lòng nhập nội dung bài viết");
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedFilePath = "";
      if (media) {
        const uploadRes = await uploadService.uploadPostMedia(media);
        uploadedFilePath = uploadRes.url || uploadRes.filePath;
      }

      await postService.createPost({
        desc: desc.trim(),
        classCode,
        img: media?.type.includes("image") ? uploadedFilePath || undefined : undefined,
        video: media?.type.includes("video") ? uploadedFilePath || undefined : undefined,
      });

      setDesc("");
      setMedia(null);
      setSettings({ type: "original", sensitive: false });
      toast.success("Đăng bài thành công!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi đăng bài!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 sm:p-4 lg:p-6 flex gap-3 sm:gap-4"
    >
      {/* AVATAR */}
      <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0">
        <Image path={userImg || "/avatar.png"} alt="" w={100} h={100} tr={true} />
      </div>
      {/* OTHERS */}
      <div className="flex-1 flex flex-col gap-3 sm:gap-4">
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Chia sẻ điều gì đó với lớp học..."
          className="bg-transparent outline-none placeholder:text-gray-500 text-sm sm:text-base lg:text-lg resize-none min-h-[60px] sm:min-h-[80px]"
          rows={3}
          required
        />
        {/* PREVIEW IMAGE */}
        {media?.type.includes("image") && previewURL && (
          <div className="relative rounded-xl overflow-hidden">
            <NextImage
              src={previewURL}
              alt=""
              width={600}
              height={600}
              className={`w-full ${
                settings.type === "original"
                  ? "h-full object-contain"
                  : settings.type === "square"
                  ? "aspect-square object-cover"
                  : "aspect-video object-cover"
              }`}
            />
            <div
              className="absolute top-2 left-2 bg-black bg-opacity-50 text-white py-1 px-4 rounded-full font-bold text-sm cursor-pointer"
              onClick={() => setIsEditorOpen(true)}
            >
              Edit
            </div>
            <div
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white h-8 w-8 flex items-center justify-center rounded-full cursor-pointer font-bold text-sm"
              onClick={() => setMedia(null)}
            >
              X
            </div>
          </div>
        )}
        {media?.type.includes("video") && previewURL && (
          <div className="relative">
            <video src={previewURL} controls />
            <div
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white h-8 w-8 flex items-center justify-center rounded-full cursor-pointer font-bold text-sm"
              onClick={() => setMedia(null)}
            >
              X
            </div>
          </div>
        )}
        {isEditorOpen && previewURL && (
          <ImageEditor
            onClose={() => setIsEditorOpen(false)}
            previewURL={previewURL}
            settings={settings}
            setSettings={setSettings}
          />
        )}
        <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
          <div className="flex gap-3 sm:gap-4 flex-wrap">
            <input
              type="file"
              onChange={handleMediaChange}
              className="hidden"
              id="file"
              accept="image/*,video/*"
            />
            <label
              htmlFor="file"
              className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <NextImage
                src="/icons/picture.png"
                alt="Upload image"
                width={16}
                height={16}
                className="sm:w-5 sm:h-5"
              />
              <span className="hidden sm:inline text-sm text-gray-600">
                Ảnh/Video
              </span>
            </label>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2 px-3 sm:px-4 text-sm sm:text-base disabled:cursor-not-allowed disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang đăng...</span>
              </>
            ) : (
              <span>Đăng bài</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default Share;