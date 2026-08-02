// components/CourseContent.tsx
"use client";

import { useState } from "react";
import type { Chapter, Video } from "@prisma/client";
import { ChevronDownIcon, PlayCircleIcon, CheckCircleIcon } from "./Icons";

type CourseContentProps = {
  chapters: (Chapter & { videos: Video[] })[];
  onSelectVideo: (video: Video) => void;
  currentVideoId?: string;
  watchedVideos: Set<string>;
};

export default function CourseContent({
  chapters,
  onSelectVideo,
  currentVideoId,
  watchedVideos,
}: CourseContentProps) {
  const [openChapterId, setOpenChapterId] = useState<string | null>(
    chapters[0]?.id || null
  );

  const toggleChapter = (chapterId: string) => {
    setOpenChapterId((prevId) => (prevId === chapterId ? null : chapterId));
  };

  return (
    <div className=" overflow-hidden text-gray-700">
      <h2 className="text-2xl font-bold ml-2">
        Nội dung khóa học
      </h2>

      <div className="space-y-1 p-2">
        {chapters.map((chapter) => (
          <div key={chapter.id}>
            <button
              onClick={() => toggleChapter(chapter.id)}
              className="w-full flex justify-between items-center text-left p-4 bg-gray-100  hover:bg-gray-200 rounded-md transition-colors"
            >
              <span className="font-semibold text-base">{chapter.title}</span>
              <ChevronDownIcon
                className={`w-6 h-6 transition-transform ${
                  openChapterId === chapter.id ? "rotate-180" : ""
                }`}
              />
            </button>

            {openChapterId === chapter.id && (
              <ul className=" py-2 space-y-2  rounded-b-md">
                {chapter.videos.map((video) => {
                  const isPlaying = video.id === currentVideoId;
                  const isWatched = watchedVideos.has(video.id);

                  return (
                    <li key={video.id}>
                      <button
                        onClick={() => onSelectVideo(video)}
                        className={`w-full flex items-center space-x-3 text-left p-3 rounded-md transition-all ${
                          isPlaying
                            ? "bg-cyan text-cyan-700"
                            : "hover:bg-gray-200 text-gray-300"
                        }`}
                      >
                        {isWatched ? (
                          <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                        ) : (
                          <PlayCircleIcon className="w-6 h-6 text-gray-500 flex-shrink-0" />
                        )}

                        <div className="flex-1">
                          <p
                            className={`font-medium ${
                              isPlaying ? "text-cyan-500" : "text-gray-700"
                            }`}
                          >
                            {video.title}
                          </p>
                          <p className="text-xs text-gray-400">
                            {video.duration}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
