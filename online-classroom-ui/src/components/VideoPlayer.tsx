// components/VideoPlayer.tsx
"use client";

import type { Video } from "@prisma/client";
import { extractYouTubeVideoId } from "@/lib/utils";

type VideoPlayerProps = {
  video: Video | null;
};

// Convert YouTube URL to embed URL
function getYouTubeEmbedUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url; // fallback to original URL
}

// Check if URL is YouTube URL
function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/.test(url);
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  if (!video) {
    return (
      <div className="sticky top-8 flex items-center justify-center aspect-video bg-gray-800 rounded-lg shadow-lg">
        <p className="text-gray-400">Chọn một video để bắt đầu học</p>
      </div>
    );
  }

  return (
    <div className="sticky top-8">
      <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl mb-4">
        {isYouTubeUrl(video.url) ? (
          <iframe
            className="w-full h-full"
            src={getYouTubeEmbedUrl(video.url)}
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <video key={video.url} controls autoPlay className="w-full h-full">
            <source src={video.url} type="video/mp4" />
            Trình duyệt của bạn không hỗ trợ thẻ video.
          </video>
        )}
      </div>

      <div className=" p-5 rounded-lg">
        <h2 className="text-2xl font-bold mb-2 text-cyan-400">
          {video.title}
        </h2>
        <p className="text-gray-700">{video.description}</p>
      </div>
    </div>
  );
}
