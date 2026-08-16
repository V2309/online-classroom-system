import BigCalendar from "@/components/BigCalendar";
import { getCurrentUser } from "@/lib/auth-server";
import { serverFetch } from "@/lib/server-api";

export default async function ClassSchedulePage({
  params,
}: {
  params: { id: string };
}) {
  const user = getCurrentUser();

  if (!user || (user.role !== "teacher" && user.role !== "student")) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-foreground bg-background">
        <div className="bg-white border border-border rounded-3xl p-8 max-w-md text-center shadow-sm">
          <p className="text-base font-bold text-destructive mb-2">Truy cập bị từ chối</p>
          <p className="text-xs text-muted-foreground">Bạn không có quyền truy cập vào lịch học này.</p>
        </div>
      </div>
    );
  }

  const classCode = params.id;
  let schedules: any[] = [];
  let teacherClasses: any[] = [];
  let classInfo: any = null;

  try {
    const [schedulesData, classesData, classDetail] = await Promise.all([
      serverFetch<any[]>(`/schedule?classCode=${classCode}`),
      user.role === "teacher" ? serverFetch<any>("/classes") : Promise.resolve([]),
      serverFetch<any>(`/classes/${classCode}`),
    ]);
    schedules = Array.isArray(schedulesData) ? schedulesData : (schedulesData as any)?.data || [];
    teacherClasses = Array.isArray(classesData) ? classesData : (classesData as any)?.data || [];
    classInfo = classDetail;
  } catch (error) {
    console.error("Failed to load class schedule data:", error);
  }

  if (!classInfo) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-foreground bg-background">
        <div className="bg-white border border-border rounded-3xl p-8 max-w-md text-center shadow-sm">
          <p className="text-base font-bold text-destructive mb-2">Không tìm thấy lớp học</p>
          <p className="text-xs text-muted-foreground">Không tìm thấy thông tin lịch học của lớp này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4 sm:p-5 flex flex-col overflow-hidden bg-background text-foreground">
      <BigCalendar
        schedules={schedules}
        role={user.role as "teacher" | "student"}
        classId={classInfo.id}
        className={classInfo.name}
        teacherClasses={teacherClasses}
      />
    </div>
  );
}