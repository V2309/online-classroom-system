import { getCurrentUser } from "@/lib/auth-server";
import { redirect, notFound } from "next/navigation";
import CourseForm from "@/components/forms/CourseForm";
import { serverFetch } from "@/lib/server-api";
import { CourseItem, FolderItem } from "@/types/course";

export default async function EditCoursePage({
  params,
}: {
  params: { id: string; videoId: string };
}) {
  const user = getCurrentUser();
  if (!user || user.role !== "teacher") {
    redirect("/");
  }

  const classCode = params.id;
  const courseId = params.videoId;

  let course: CourseItem | null = null;
  let folders: FolderItem[] = [];

  try {
    const [courseData, foldersData] = await Promise.all([
      serverFetch<CourseItem>(`/courses/${courseId}?classCode=${classCode}`),
      serverFetch<FolderItem[]>(`/courses/class/${classCode}/folders`),
    ]);
    course = courseData;
    folders = foldersData;
  } catch (error) {
    console.error("Lỗi lấy thông tin khóa học / thư mục:", error);
  }

  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Chỉnh sửa khóa học
          </h1>
          <p className="mt-2 text-gray-600">
            Chỉnh sửa khóa học {course.title} trong lớp {classCode}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <CourseForm
            classCode={classCode}
            folders={folders as any}
            course={course as any}
          />
        </div>
      </div>
    </div>
  );
}
