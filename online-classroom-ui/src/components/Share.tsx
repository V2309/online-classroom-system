
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Image from "./Image";
import NextImage from "next/image";
import ImageEditor from "@/components/ImageEditor";
import { addPostToClass } from "@/lib/actions/post.action";
import { toast } from "react-toastify";

// Component con để sử dụng useFormStatus
const SubmitButton = () => {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2 px-3 sm:px-4 text-sm sm:text-base disabled:cursor-not-allowed disabled:opacity-50 transition-all"
      disabled={pending}
    >
      {pending ? "Đang đăng..." : "Đăng bài"}
    </button>
  );
};

const Share = ({ classCode, userImg }: { classCode: string, userImg?: string }) => {
  const [media, setMedia] = useState<File | null>(null);
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

  const [state, formAction] = useFormState(addPostToClass, {
    success: false,
    error: false,
  });

  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setMedia(null);
      setSettings({ type: "original", sensitive: false });
      toast.success("Đăng bài thành công!", {
        position: "bottom-right",
        autoClose: 3000,
      });
    }
    if (state.error) {
      toast.error("Có lỗi xảy ra khi đăng bài!", {
        position: "bottom-right",
        autoClose: 5000,
      });
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      className="p-3 sm:p-4 lg:p-6 flex gap-3 sm:gap-4"
      action={formAction}
    >
      {/* AVATAR */}
      <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0">
        <Image path={userImg || "/avatar.png"} alt="" w={100} h={100} tr={true} />
      </div>
      {/* OTHERS */}
      <div className="flex-1 flex flex-col gap-3 sm:gap-4">
        <input
          type="hidden"
          name="classCode"
          value={classCode}
        />
        <input
          type="text"
          name="imgType"
          value={settings.type}
          hidden
          readOnly
        />
        <input
          type="text"
          name="isSensitive"
          value={settings.sensitive ? "true" : "false"}
          hidden
          readOnly
        />
        <textarea
          name="desc"
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
              name="file"
              onChange={handleMediaChange}
              className="hidden"
              id="file"
              accept="image/*,video/*"
            />
            <label htmlFor="file" className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <NextImage
                src="/icons/picture.png"
                alt="Upload image"
                width={16}
                height={16}
                className="sm:w-5 sm:h-5"
              />
              <span className="hidden sm:inline text-sm text-gray-600">Ảnh/Video</span>
            </label>
          </div>
          <SubmitButton />
          {state.error && (
            <span className="text-red-500 text-sm mt-2">Có lỗi xảy ra!</span>
          )}
        </div>
      </div>
    </form>
  );
};

export default Share;