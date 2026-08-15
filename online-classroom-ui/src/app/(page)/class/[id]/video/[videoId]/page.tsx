import { getCurrentUser } from "@/lib/auth-server";
import { serverFetch } from "@/lib/server-api";
import CourseDetailClient from "@/components/CourseDetailClient";
import { CourseItem } from "@/types/course";
import { notFound } from "next/navigation";

export type CourseWithChaptersAndVideos = CourseItem;

export default async function CoursePage({
  params,
}: {
  params: { id: string; videoId: string };
}) {
  const user = getCurrentUser();
  if (!user || (user.role !== "teacher" && user.role !== "student")) {
    return <div>Bạn không có quyền truy cập.</div>;
  }

  const classCode = params.id;
  const courseId = params.videoId;

  let course: CourseItem | null = null;
  try {
    course = await serverFetch<CourseItem>(
      `/courses/${courseId}?classCode=${classCode}`
    );
  } catch (error) {
    console.error("Lỗi lấy thông tin khóa học:", error);
  }

  if (!course) {
    notFound();
  }

  return (
    <CourseDetailClient
      course={course as any}
      classCode={classCode}
      role={user.role as string}
    />
  );
}
