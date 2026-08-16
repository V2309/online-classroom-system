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
    return <div className="p-4 text-destructive bg-background">Bạn không có quyền truy cập.</div>;
  }

  const classCode = params.id;
  let schedules: any[] = [];
  let teacherClasses: any[] = [];
  let classInfo: any = null;

  try {
    const [schedulesData, classesData, classDetail] = await Promise.all([
      serverFetch<any[]>(`/schedule?classCode=${classCode}`),
      user.role === 'teacher' ? serverFetch<any>('/classes') : Promise.resolve([]),
      serverFetch<any>(`/classes/${classCode}`),
    ]);
    schedules = Array.isArray(schedulesData) ? schedulesData : (schedulesData as any)?.data || [];
    teacherClasses = Array.isArray(classesData) ? classesData : (classesData as any)?.data || [];
    classInfo = classDetail;
  } catch (error) {
    console.error("Failed to load class schedule data:", error);
  }

  if (!classInfo) {
    return <div className="p-4 text-destructive bg-background">Không tìm thấy thông tin lớp học.</div>;
  }

  return (
    <div className="h-full w-full overflow-hidden bg-background text-foreground flex flex-col">
      <BigCalendar
        schedules={schedules}
        role={user.role as "teacher" | "student"}
        classId={classInfo.id}
        teacherClasses={teacherClasses}
      />
    </div>
  );
}