"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";

interface ClassImageManagerProps {
  currentImage?: string | null;
  classCode: string;
}

export default function ClassImageManager({ currentImage, classCode }: ClassImageManagerProps) {
  const [imageUrl, setImageUrl] = useState<string>(currentImage || "");

  return (
    <>
      {/* Hidden input để gửi URL về server */}
      <input type="hidden" name="imageUrl" value={imageUrl} />
      
      <ImageUpload
        currentImage={currentImage}
        classCode={classCode}
        onImageUploaded={setImageUrl}
      />
    </>
  );
}
