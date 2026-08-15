"use client";

import { useState, useMemo } from "react";
import { CourseWithChaptersAndVideos } from "@/app/(page)/class/[id]/video/[videoId]/page";
import type { VideoItem } from "@/types/course";
import CourseContent from "@/components/CourseContent";
import ProgressBar from "@/components/ProgressBar";
import VideoPlayer from "@/components/VideoPlayer";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface CourseDetailClientProps {
  course: CourseWithChaptersAndVideos;
  classCode: string;
  role?: string;
}

export default function CourseDetailClient({
  course,
  classCode,
  role,
}: CourseDetailClientProps) {
  const chapters = course.chapters || [];
  const firstVideo = chapters[0]?.videos?.[0] || null;

  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(firstVideo);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(
    new Set(currentVideo ? [currentVideo.id] : [])
  );

  const totalVideos = useMemo(
    () => chapters.reduce((acc, chapter) => acc + (chapter.videos?.length || 0), 0),
    [chapters]
  );

  const handleSelectVideo = (video: VideoItem) => {
    setCurrentVideo(video);
    setWatchedVideos((prev) => {
      const next = new Set(prev);
      next.add(video.id);
      return next;
    });
  };

  const progressPercentage =
    totalVideos > 0 ? (watchedVideos.size / totalVideos) * 100 : 0;

  const router = useRouter();
  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen text-white antialiased">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {/* quay lại */}
            <button
              onClick={handleGoBack}
              className="text-md text-blue-400 hover:underline border border-blue-400 px-3 py-1 rounded-md"
            >
              <ArrowLeft className="inline-block mr-1" />
              Quay lại
            </button>
            <h1 className="text-2xl font-bold text-cyan-400 mb-2">
              {course.title}
            </h1>
            <ProgressBar
              progress={progressPercentage}
              watchedCount={watchedVideos.size}
              totalCount={totalVideos}
            />
          </div>
          <p className="text-lg text-gray-400">{course.description}</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <VideoPlayer video={currentVideo} />
          </div>
          <div className="lg:col-span-1">
            <CourseContent
              chapters={chapters}
              onSelectVideo={handleSelectVideo}
              currentVideoId={currentVideo?.id}
              watchedVideos={watchedVideos}
            />
          </div>
        </main>
      </div>
    </div>
  );
}