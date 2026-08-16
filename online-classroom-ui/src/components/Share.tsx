"use client";

import React, { useState } from "react";
import Image from "./Image";
import NextImage from "next/image";
import ImageEditor from "@/components/ImageEditor";
import { uploadService } from "@/services/upload.service";
import { postService } from "@/services/post.service";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Video as VideoIcon, Paperclip, X, Send, Sparkles } from "lucide-react";

const Share = ({ classCode, userImg }: { classCode: string; userImg?: string }) => {
  const router = useRouter();
  const [desc, setDesc] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
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

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
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
      setAttachment(null);
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
      className="bg-white rounded-3xl border border-border shadow-sm p-5 sm:p-6 transition-all hover:shadow-md"
    >
      {/* TOP SECTION: AVATAR + INPUT */}
      <div className="flex items-start gap-3.5 sm:gap-4">
        {/* AVATAR */}
        <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-border shadow-2xs mt-0.5">
          <Image
            path={userImg || "/avatar.png"}
            alt=""
            w={100}
            h={100}
            tr={true}
            className="object-cover w-full h-full"
          />
        </div>

        {/* INPUT CONTAINER */}
        <div className="flex-1 bg-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-border/70 transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Bạn muốn chia sẻ điều gì với lớp học hôm nay?"
            className="w-full bg-transparent outline-none border-none text-foreground placeholder:text-muted-foreground text-xs sm:text-sm resize-none min-h-[55px] sm:min-h-[65px] leading-relaxed font-medium"
            rows={2}
            required
          />
        </div>
      </div>

      {/* PREVIEWS */}
      {media?.type.includes("image") && previewURL && (
        <div className="relative rounded-2xl overflow-hidden mt-4 border border-border shadow-2xs">
          <NextImage
            src={previewURL}
            alt="Preview ảnh bài đăng"
            width={600}
            height={600}
            className={`w-full ${
              settings.type === "original"
                ? "h-full object-contain max-h-96"
                : settings.type === "square"
                ? "aspect-square object-cover"
                : "aspect-video object-cover"
            }`}
          />
          <div
            className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white py-1 px-3.5 rounded-full font-semibold text-xs cursor-pointer hover:bg-black/80 transition"
            onClick={() => setIsEditorOpen(true)}
          >
            Chỉnh sửa ảnh
          </div>
          <button
            type="button"
            className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white h-7 w-7 flex items-center justify-center rounded-full cursor-pointer hover:bg-black/80 transition"
            onClick={() => setMedia(null)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {media?.type.includes("video") && previewURL && (
        <div className="relative rounded-2xl overflow-hidden mt-4 border border-border shadow-2xs">
          <video src={previewURL} controls className="w-full max-h-96 rounded-2xl" />
          <button
            type="button"
            className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white h-7 w-7 flex items-center justify-center rounded-full cursor-pointer hover:bg-black/80 transition"
            onClick={() => setMedia(null)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {attachment && (
        <div className="flex items-center justify-between bg-card rounded-2xl px-4 py-2.5 mt-3 border border-border shadow-2xs">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-secondary truncate">
            <Paperclip className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="font-semibold truncate">{attachment.name}</span>
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="text-muted-foreground hover:text-destructive p-1 rounded-full cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
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

      {/* DIVIDER LINE */}
      <div className="border-t border-border/70 my-3.5 sm:my-4" />

      {/* BOTTOM ACTION BAR */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* PILL BUTTONS */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* ẢNH */}
          <input
            type="file"
            onChange={handleMediaChange}
            className="hidden"
            id="post-image-file"
            accept="image/*"
          />
          <label
            htmlFor="post-image-file"
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-accent hover:bg-accent/80 text-primary cursor-pointer transition-all text-xs sm:text-sm font-bold select-none shadow-2xs active:scale-95"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Ảnh</span>
          </label>

          {/* VIDEO */}
          <input
            type="file"
            onChange={handleMediaChange}
            className="hidden"
            id="post-video-file"
            accept="video/*"
          />
          <label
            htmlFor="post-video-file"
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 cursor-pointer transition-all text-xs sm:text-sm font-bold select-none shadow-2xs active:scale-95"
          >
            <VideoIcon className="w-4 h-4" />
            <span>Video</span>
          </label>

          {/* ĐÍNH KÈM */}
          <input
            type="file"
            onChange={handleAttachmentChange}
            className="hidden"
            id="post-attach-file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
          />
          <label
            htmlFor="post-attach-file"
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-muted hover:bg-muted/80 text-secondary cursor-pointer transition-all text-xs sm:text-sm font-semibold select-none shadow-2xs active:scale-95"
          >
            <Paperclip className="w-4 h-4" />
            <span>Đính kèm</span>
          </label>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-full py-2.5 px-6 sm:px-7 text-xs sm:text-sm disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Đang đăng...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Đăng bài</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default Share;