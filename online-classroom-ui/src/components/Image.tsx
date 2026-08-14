"use client";

import NextImage from "next/image";

type ImageType = {
  path?: string;
  src?: string;
  w?: number;
  h?: number;
  alt: string;
  className?: string;
  tr?: boolean;
  priority?: boolean;
};

const Image = ({
  path,
  src,
  w,
  h,
  alt,
  className,
  priority = false,
}: ImageType) => {
  const imageSrc = path || src || "/avatar.png";

  return (
    <NextImage
      src={imageSrc}
      width={w || 100}
      height={h || 100}
      alt={alt || "Image"}
      className={className}
      priority={priority}
      unoptimized={imageSrc.startsWith("http://") || imageSrc.startsWith("https://") || imageSrc.startsWith("blob:") || imageSrc.startsWith("data:")}
    />
  );
};

export default Image;