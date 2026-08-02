import BigCalendar from "@/components/BigCalendar";
import { getTeacherSchedules, getStudentSchedules } from "@/lib/actions/schedule.action";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function SchedulePage() {
  // Lấy user hiện tại
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "teacher" && user.role !== "student")) {
    return <div>Bạn không có quyền truy cập.</div>;
  }
  // Lấy dữ liệu lịch học và danh sách lớp (song song)
  const [schedules, teacherClasses] = await Promise.all([
    // Lấy dữ liệu lịch học theo role
    user.role === "teacher" ? getTeacherSchedules() : getStudentSchedules(),
    
    // Lấy danh sách lớp học của giáo viên (chỉ khi là teacher)
    user.role === "teacher" 
      ? prisma.class.findMany({
          where: {
            supervisor: { userId: user.id as string },
            deleted: false,
          },
          include: {
            _count: {
              select: { students: true }
            }
          },
          orderBy: { name: 'asc' }
        })
      : []
  ]);
  
  return (
    <div className="w-full overflow-hidden">
      {/* Calendar Container */}
      <div>
        <BigCalendar 
          schedules={schedules} 
          role={user.role as "teacher" | "student"}
          teacherClasses={teacherClasses} // Truyền danh sách lớp học của giáo viên
        />
      </div>
    </div>
  );
}