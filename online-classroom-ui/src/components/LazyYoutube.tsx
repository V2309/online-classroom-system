// components/LazyYouTube.tsx

"use client";
import { useState } from 'react';
import Image from 'next/image'; // 1. Import Image

export default function LazyYouTube({ videoId }: { videoId: string }) {
  const [load, setLoad] = useState(false);
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

  if (!load) {
    return (
      <div 
        onClick={() => setLoad(true)}
        className="w-full h-full cursor-pointer relative"
      >
        {/* 2. THAY THẾ <img> BẰNG <Image> */}
        <Image 
          src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`} 
          alt="Video thumbnail"
          fill // Tự động lấp đầy div cha
          style={{ objectFit: 'cover' }} // Tương đương className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Nút Play giả (giữ nguyên) */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-all duration-300 hover:bg-black/10">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
    );
  }

  // Trạng thái đã click (giữ nguyên)
  return (
    <iframe
      width="100%"
      height="100%"
      src={embedUrl}
      title="YouTube video player"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      className="w-full h-full"
    ></iframe>
  );
}