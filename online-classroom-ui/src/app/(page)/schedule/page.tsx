import BigCalendar from "@/components/BigCalendar";
import { getCurrentUser } from "@/lib/auth-server";
import { serverFetch } from "@/lib/server-api";

export default async function SchedulePage() {
  const user = getCurrentUser();

  if (!user || (user.role !== "teacher" && user.role !== "student")) {
    return <div className="p-4 text-destructive bg-background">Bạn không có quyền truy cập.</div>;
  }

  let schedules: any[] = [];
  let teacherClasses: any[] = [];

  try {
    const [schedulesData, classesData] = await Promise.all([
      serverFetch<any[]>('/schedule'),
      user.role === 'teacher' ? serverFetch<any>('/classes') : Promise.resolve([]),
    ]);
    schedules = Array.isArray(schedulesData) ? schedulesData : (schedulesData as any)?.data || [];
    teacherClasses = Array.isArray(classesData) ? classesData : (classesData as any)?.data || [];
  } catch (error) {
    console.error("Failed to load schedule data:", error);
  }

  return (
    <div className="h-full w-full overflow-hidden bg-background text-foreground flex flex-col">
      <BigCalendar
        schedules={schedules}
        role={user.role as "teacher" | "student"}
        teacherClasses={teacherClasses}
      />
    </div>
  );
}