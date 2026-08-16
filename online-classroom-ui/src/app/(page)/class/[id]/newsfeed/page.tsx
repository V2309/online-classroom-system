import Feed from "@/components/Feed";
import Share from "@/components/Share";
import ClassUpcomingSchedule from "@/components/ClassUpcomingSchedule";
import { getCurrentUser } from "@/lib/auth-server";
import { serverFetch } from "@/lib/server-api";
import ClassPageHeader from "@/components/ClassPageHeader";

export default async function NewsfeedPage({ params }: { params: { id: string } }) {
  // Lấy thông tin lớp học và lịch học từ NestJS API
  let classInfo: any = null;
  let schedules: any[] = [];
  try {
    const [classRes, schedulesRes] = await Promise.all([
      serverFetch(`/classes/${params.id}`),
      serverFetch(`/schedule?classCode=${params.id}`).catch(() => []),
    ]);
    classInfo = classRes;
    schedules = Array.isArray(schedulesRes) ? schedulesRes : (schedulesRes as any)?.data || [];
  } catch (error) {
    console.error("Lỗi lấy thông tin lớp học hoặc lịch học:", error);
  }

  if (!classInfo) {
    return (
      <div className="p-8 text-center text-destructive font-medium bg-background">
        Không tìm thấy lớp học
      </div>
    );
  }

  // Lấy thông tin user hiện tại
  const user = getCurrentUser();
  const classCode = classInfo.class_code || params.id;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ClassPageHeader title={`Bảng tin lớp: ${classInfo.name}`} className="sticky top-0 z-40" />

      {/* Content Layout: Trái (Posts) - Phải (Schedule Widget) */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* CỘT TRÁI: Form tạo bài viết & Danh sách bài đăng */}
          <div className="flex-1 w-full min-w-0">
            {/* Form tạo bài viết mới */}
            <div className="mb-4 sm:mb-6">
              <Share classCode={classCode} userImg={user?.img || undefined} />
            </div>

            {/* Feed */}
            <div className="space-y-4 sm:space-y-6">
              <Feed classCode={classCode} />
            </div>
          </div>

          {/* CỘT PHẢI: Lịch / Thông báo sắp diễn ra */}
          <div className="w-full lg:w-80 xl:w-88 flex-shrink-0 lg:sticky lg:top-24">
            <ClassUpcomingSchedule classCode={classCode} schedules={schedules} />
          </div>
        </div>
      </div>
    </div>
  );
}
