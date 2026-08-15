import { getCurrentUser } from "@/lib/auth-server";
import { serverFetch } from "@/lib/server-api";
import VideoList from "@/components/VideoPageClient";
import { notFound } from "next/navigation";
import {
  ClassCoursesResponse,
  CourseItem,
  FolderItem,
} from "@/types/course";

// Types giữ lại cho tương thích với client components
export type CourseWithDetails = CourseItem;
export type FolderWithCourseCount = FolderItem;

export default async function VideoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}) {
  const user = getCurrentUser();

  if (!user || (user.role !== "teacher" && user.role !== "student")) {
    notFound();
  }

  const classCode = params.id;
  const { page, search, folderId } = searchParams;
  const p = page ? parseInt(page) : 1;

  let queryParams = new URLSearchParams();
  if (page) queryParams.set("page", page);
  if (search) queryParams.set("search", search);
  if (folderId) queryParams.set("folderId", folderId);

  const queryString = queryParams.toString();
  const endpoint = `/courses/class/${classCode}${queryString ? `?${queryString}` : ""}`;

  let data: ClassCoursesResponse = {
    courses: [],
    count: 0,
    folders: [],
    allCoursesCount: 0,
    page: p,
    limit: 10,
  };

  try {
    data = await serverFetch<ClassCoursesResponse>(endpoint);
  } catch (error) {
    console.error("Lỗi lấy danh sách khóa học:", error);
  }

  return (
    <VideoList
      data={data.courses || []}
      count={data.count || 0}
      folders={data.folders || []}
      allCoursesCount={data.allCoursesCount || 0}
      page={p}
      classCode={classCode}
      role={user.role as string}
    />
  );
}