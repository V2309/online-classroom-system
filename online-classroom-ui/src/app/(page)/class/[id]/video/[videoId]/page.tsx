import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Course, Video, Chapter, Teacher, Student } from "@prisma/client";
import CourseDetailClient from "@/components/CourseDetailClient";

// Types cho course detail
export type CourseWithChaptersAndVideos = Course & {
  chapters: (Chapter & {
    videos: Video[];
  })[];
  teacher: Teacher;
};

// Server Component - lấy dữ liệu từ database
export default async function CoursePage({ 
  params,
  searchParams
}: { 
  params: { id: string; videoId: string },
  searchParams: { [key: string]: string | undefined };
}) {
  // Lấy user hiện tại
  const user = await getCurrentUser();
  if (!user || (user.role !== "teacher" && user.role !== "student")) {
    return <div>Bạn không có quyền truy cập.</div>;
  }

  // phân trang
  const {page,...queryParams} = searchParams; 
  const p = page ? parseInt(page) : 1;

  const classCode = params.id;
  const courseId = params.videoId;

  // Kiểm tra quyền truy cập lớp học theo role và lấy thông tin class
  let classRoom;
  
  if (user.role === "teacher") {
    // Lấy teacher theo user.id
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id as string },
    });
    
    if (!teacher) {
      return <div>Không tìm thấy thông tin giáo viên.</div>;
    }

    // Kiểm tra lớp học có tồn tại và teacher có quyền truy cập không
    classRoom = await prisma.class.findFirst({
      where: {
        class_code: classCode,
        supervisorId: teacher.id,
        deleted: false,
      },
      include: {
        supervisor: true
      }
    });

    if (!classRoom) {
      return <div>Không tìm thấy lớp học hoặc bạn không có quyền truy cập.</div>;
    }
  } else {
    // Student role
    const student = await prisma.student.findUnique({
      where: { userId: user.id as string },
    });

    if (!student) {
      return <div>Không tìm thấy thông tin học sinh.</div>;
    }

    // Kiểm tra student có trong lớp học không
    classRoom = await prisma.class.findFirst({
      where: {
        class_code: classCode,
        deleted: false,
        students: {
          some: {
            id: student.id
          }
        }
      },
      include: {
        supervisor: true
      }
    });

    if (!classRoom) {
      return <div>Không tìm thấy lớp học hoặc bạn không có quyền truy cập.</div>;
    }
  }

  // Lấy course với chapters và videos (sử dụng supervisor từ classRoom)
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      classCode: classCode,
      createdBy: classRoom.supervisorId!,
      isActive: true,
    },
    include: {
      chapters: {
        where: {
          isActive: true,
        },
        include: {
          videos: {
            where: {
              isActive: true,
            },
            orderBy: {
              orderIndex: 'asc',
            },
          },
        },
        orderBy: {
          orderIndex: 'asc',
        },
      },
      teacher: true,
    },
  });



  if (!course) {
    return <div>Không tìm thấy khóa học.</div>;
  }

  return (
    <CourseDetailClient 
      course={course}
      classCode={classCode}
      role={user.role}
    />
  );
}
