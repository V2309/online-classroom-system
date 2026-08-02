import ImageKit from "imagekit"

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});



export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ===== IMAGE & YOUTUBE UTILITIES =====

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  
  return null;
}

/**
 * Get YouTube thumbnail URL from video ID
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'maxres'): string {
  const qualityMap = {
    'default': 'default.jpg',
    'medium': 'mqdefault.jpg', 
    'high': 'hqdefault.jpg',
    'maxres': 'maxresdefault.jpg'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`;
}

/**
 * Extract YouTube thumbnail from YouTube URL
 */
export function extractYouTubeThumbnailFromUrl(youtubeUrl: string): string | null {
  const videoId = extractYouTubeVideoId(youtubeUrl);
  return videoId ? getYouTubeThumbnail(videoId) : null;
}

/**
 * Check if URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/.test(url);
}

/**
 * Generate thumbnail URL from course videos (prioritize YouTube videos)
 */
export function generateThumbnailFromCourseVideos(videos: any[]): string {
  const fallback = '/images/default-course-thumbnail.svg';
  if (!videos || videos.length === 0) return fallback;
  
  // Tìm video YouTube đầu tiên
  for (const video of videos) {
    if (video.videoUrl && isYouTubeUrl(video.videoUrl)) {
      const thumbnail = extractYouTubeThumbnailFromUrl(video.videoUrl);
      if (thumbnail) return thumbnail;
    }
  }
  
  return fallback;
}

/**
 * Process image URL for Next.js Image component
 */
export function processImageUrl(url: string): string {
  const fallback = '/images/default-course-thumbnail.svg';
  if (!url) return fallback;
  
  // Nếu là YouTube URL, extract thumbnail
  if (isYouTubeUrl(url)) {
    const thumbnail = extractYouTubeThumbnailFromUrl(url);
    return thumbnail || fallback;
  }
  
  return url || fallback;
}