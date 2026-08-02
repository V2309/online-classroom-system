// components/ProgressBar.tsx
interface ProgressBarProps {
  progress: number;
  watchedCount: number;
  totalCount: number;
}

export default function ProgressBar({
  progress,
  watchedCount,
  totalCount,
}: ProgressBarProps) {
  return (
    <div className="">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-300">
          Tiến độ khóa học
        </span>
        <span className="text-sm font-medium text-cyan-400">
          {watchedCount} / {totalCount} video
        </span>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}
