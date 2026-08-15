import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import CourseForm from "@/components/forms/CourseForm";
import { serverFetch } from "@/lib/server-api";
import { FolderItem } from "@/types/course";

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Tạo khóa học mới
          </h1>
          <p className="mt-2 text-gray-600">
            Tạo khóa học cho lớp {classCode}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <CourseForm
            classCode={classCode}
            folders={folders as any}
          />
        </div>
      </div>
    </div>
  );
}