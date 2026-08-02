import BigCalendar from "@/components/BigCalendar";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client"; // Import kiểu dữ liệu

export default async function ClassSchedulePage({
  params,
}: {
  params: { id: string };
}) {
  // Lấy user hiện tại (Bắt buộc, không thể song song)
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "teacher" && user.role !== "student")) {
    return <div>Bạn không có quyền truy cập.</div>;
  }

  const classCode = params.id;

  // 1. Xây dựng truy vấn xác thực dựa trên role
  // Chúng ta sẽ kiểm tra quyền truy cập trực tiếp thay vì lấy teacher/student trước
  let authCheck: Prisma.ClassWhereInput;

  if (user.role === "teacher") {
    authCheck = {
      class_code: classCode,
      deleted: false,
      supervisor: { userId: user.id as string } // Gộp 2 truy vấn thành 1
    };
  } else { // 'student'
    authCheck = {
      class_code: classCode,
      deleted: false,
      students: { some: { userId: user.id as string } } // Gộp 2 truy vấn thành 1
    };
  }

  // 2. Chạy truy vấn xác thực VÀ truy vấn lấy dữ liệu CÙNG LÚC
  const [classAccess, schedules, teacherClasses] = await Promise.all([
    // Truy vấn 1 (Xác thực): Lấy thông tin lớp để kiểm tra và lấy id
    prisma.class.findFirst({
      where: authCheck,
      select: { id: true, name: true, class_code: true } // Lấy thêm thông tin lớp
    }),
    
    // Truy vấn 2 (Lấy dữ liệu): Chạy song song với truy vấn 1
    prisma.event.findMany({
      where: {
        class: {
          class_code: classCode,
          deleted: false,
        }
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            class_code: true,
          }
        },
      },
      orderBy: {
        startTime: 'asc'
      }
    }),

    // Truy vấn 3: Lấy tất cả lớp học của giáo viên (chỉ khi là teacher)
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

  // 3. Kiểm tra kết quả xác thực
  if (!classAccess) {
    return <div>Bạn không có quyền truy cập lớp học này.</div>;
  }

  // 4. Transform data (Giữ nguyên, bước này nhanh vì là JavaScript thuần)
  const transformedSchedules = schedules.map(event => ({
    id: event.id,
    title: event.title,
    description: event.description || 'Không có mô tả',
    startTime: event.startTime,
    endTime: event.endTime,
    meetingLink: event.meetingLink,
    class: event.class ? {
      id: event.class.id,
      name: event.class.name,
      class_code: event.class.class_code,
    } : null
  }));

  // 5. Render
  return (
    <div className="h-full overflow-hidden">
      <div>
        <BigCalendar 
          schedules={transformedSchedules} 
          role={user.role as "teacher" | "student"}
          classId={classAccess.id} // Truyền classId để tự động chọn lớp khi tạo event
          teacherClasses={teacherClasses} // Truyền danh sách lớp học của giáo viên
        />
      </div>
    </div>
  );
}