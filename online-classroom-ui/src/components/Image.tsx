"use client";

import { IKImage } from "imagekitio-next";
import NextImage from "next/image";

type ImageType = {
  path?: string;
  src?: string;
  w?: number;
  h?: number;
  alt: string;
  className?: string;
  tr?: boolean;
  priority?: boolean; // 1. Thêm prop priority
};

const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

if (!urlEndpoint) {
  throw new Error('Error: Please add urlEndpoint to .env or .env.local')
}

const Image = ({ path, src, w, h, alt, className, tr, priority = false }: ImageType) => { // 2. Thêm priority
  // Kiểm tra nếu path đã chứa URL đầy đủ (có chứa urlEndpoint)
  const isFullUrl = path?.includes(urlEndpoint || '');
  
  // Kiểm tra nếu là file local static (avatar.png, v.v.)
  const isStaticFile = path === '/avatar.png' || src === '/avatar.png' || 
                       path?.startsWith('/avatar.') || src?.startsWith('/avatar.');
  
  // Nếu là file static, sử dụng Next.js Image
  if (isStaticFile) {
    return (
      <NextImage
        src={path || src || '/avatar.png'}
        width={w || 100}
        height={h || 100}
        alt={alt}
        className={className}
        priority={priority} // 3. Truyền priority cho NextImage
      />
    );
  }
  
  const imagePath = path || src;
  
  return (
    <IKImage
      urlEndpoint={urlEndpoint}
      path={isFullUrl ? undefined : imagePath}
      src={isFullUrl ? imagePath : undefined}
      {...(tr
        ? { transformation: [{ width: `${w}`, height: `${h}` }] }
        : { width: w, height: h })}
      
      // 4. SỬA LỖI Ở ĐÂY
      // Chỉ bật LQIP khi ảnh được ưu tiên.
      // Nếu không, hãy tắt nó đi (undefined) để cho phép lazy loading.
      lqip={priority ? { active: true, quality: 20 } : undefined}
      
      // 5. SỬA LỖI THUỘC TÍNH LOADING
      // Tải "eager" (mặc định của thư viện, nên pass `undefined`) nếu ưu tiên.
      // Tải "lazy" nếu không ưu tiên.
      loading={priority ? undefined : "lazy"}

      alt={alt}
      className={className}
    />
  );
};

export default Image;