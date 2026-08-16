import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import CourseForm from "@/components/forms/CourseForm";
import { serverFetch } from "@/lib/server-api";
import { FolderItem } from "@/types/course";
import Link from "next/link";
import { ArrowLeft, Video as VideoIcon } from "lucide-react";

export default async function AddVideoPage({
  params,
}: {
  params: { id: string };
}) {
  const user = getCurrentUser();
  if (!user || user.role !== "teacher") {
    redirect("/");
  }

  const classCode = params.id;
  let folders: FolderItem[] = [];

  try {
    folders = await serverFetch<FolderItem[]>(`/courses/class/${classCode}/folders`);
  } catch (error) {
    console.error("Lỗi lấy danh sách folders:", error);
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link & Header */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/class/${classCode}/video`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách bài giảng</span>
          </Link>
        </div>

        {/* Top Title Card */}
        <div className="bg-white rounded-3xl border border-border shadow-sm p-6 sm:p-7 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent text-primary flex items-center justify-center shadow-2xs flex-shrink-0">
            <VideoIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
              Tạo khóa học video mới
            </h1>
            <p className="text-xs sm:text-sm text-secondary mt-0.5">
              Tạo các chương học và bài giảng video YouTube cho lớp {classCode}
            </p>
          </div>
        </div>

        {/* Form Container */}
        <CourseForm classCode={classCode} folders={folders as any} />
      </div>
    </div>
  );
}