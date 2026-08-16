import Feed from "@/components/Feed";
import Share from "@/components/Share";
import ClassUpcomingSchedule from "@/components/ClassUpcomingSchedule";
import ClassBanner from "@/components/ClassBanner";
import { getCurrentUser } from "@/lib/auth-server";
import { serverFetch } from "@/lib/server-api";

export default async function NewsfeedPage({ params }: { params: { id: string } }) {
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-foreground">
        <div className="bg-white border border-border rounded-3xl p-8 max-w-md text-center shadow-sm">
          <p className="text-base font-bold text-destructive mb-2">Không tìm thấy lớp học</p>
          <p className="text-xs text-muted-foreground">Lớp học không tồn tại hoặc bạn chưa tham gia lớp này.</p>
        </div>
      </div>
    );
  }

  const user = getCurrentUser();
  const classCode = classInfo.class_code || params.id;
  const isTeacher = user?.role === "teacher";

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      {/* Content Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        {/* Banner lớp học phong cách hiện đại */}
        <ClassBanner
          classInfo={classInfo}
          classCode={classCode}
          isTeacher={isTeacher}
        />

        {/* Bố cục 2 cột: Trái (Bài đăng) - Phải (Lịch học & Deadline) */}
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* CỘT TRÁI: Form tạo bài viết & Feed */}
          <div className="flex-1 w-full min-w-0 space-y-5">
            <Share classCode={classCode} userImg={user?.img || undefined} />
            <Feed classCode={classCode} />
          </div>

          {/* CỘT PHẢI: Lịch / Deadline sắp diễn ra */}
          <div className="w-full lg:w-80 xl:w-88 flex-shrink-0 lg:sticky lg:top-24">
            <ClassUpcomingSchedule classCode={classCode} schedules={schedules} />
          </div>
        </div>
      </div>
    </div>
  );
}
