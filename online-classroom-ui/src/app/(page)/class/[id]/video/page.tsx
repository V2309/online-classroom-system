// app/(page)/class/[id]/video/page.tsx

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Course, Video, Folder as PrismaFolder, Teacher, Prisma } from "@prisma/client";
import VideoList from "@/components/VideoPageClient";
import { ITEM_PER_PAGE } from "@/lib/setting";
import { notFound } from "next/navigation"; // Tối ưu 1: Import notFound

// --- Types (Giữ nguyên) ---
export type CourseWithDetails = Course & {
  videos: Video[];
  folder: PrismaFolder | null;
  teacher: Teacher;
  _count: {
    videos: number;
  };
};

export type FolderWithCourseCount = PrismaFolder & {
  _count: {
    courses: number;
  };
};

// --- Server Component (Đã tối ưu) ---
export default async function VideoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}) {
  // 1. Lấy và xác thực người dùng
  const user = await getCurrentUser();
  const role = user?.role;

  // Tối ưu 1: Dùng notFound() thay vì <div>
  if (!user || (user.role !== "teacher" && user.role !== "student")) {
    notFound(); 
  }

  const classCode = params.id;
  let teacherId: string;

  // 2. Kiểm tra quyền truy cập lớp học theo role (Giữ nguyên logic)
  if (user.role === "teacher") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id as string },
    });

    if (!teacher) {
      notFound(); // Tối ưu 1
    }

    teacherId = teacher.id;

    // Kiểm tra quyền truy cập lớp học
    const classRoom = await prisma.class.findFirst({
      where: {
        class_code: classCode,
        supervisorId: teacher.id,
        deleted: false,
      },
    });

    if (!classRoom) {
      notFound(); // Tối ưu 1
    }
  } else {
    // Student role
    const student = await prisma.student.findUnique({
      where: { userId: user.id as string },
    });

    if (!student) {
      notFound(); // Tối ưu 1
    }

    // Kiểm tra student có trong lớp học không
    const classRoom = await prisma.class.findFirst({
      where: {
        class_code: classCode,
        deleted: false,
        students: {
          some: {
            id: student.id,
          },
        },
      },
      include: {
        supervisor: true,
      },
    });

    if (!classRoom || !classRoom.supervisorId) {
      notFound(); // Tối ưu 1
    }

    teacherId = classRoom.supervisorId;
  }

  // 3. Xây dựng câu truy vấn động (Giữ nguyên)
  const { page, search, folderId } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.CourseWhereInput = {
    classCode: classCode,
    createdBy: teacherId,
    isActive: true,
  };

  if (search) {
    query.title = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (folderId) {
    if (folderId === "unassigned") {
      query.folderId = null;
    } else {
      query.folderId = folderId;
    }
  }

  // 4. Lấy dữ liệu (Đã tối ưu _count)
  const [courses, count, folders, allCoursesCount] = await prisma.$transaction([
    // [0] Lấy danh sách khóa học
    prisma.course.findMany({
      where: query,
      include: {
        videos: { orderBy: { orderIndex: "asc" } },
        folder: true,
        teacher: true,
        _count: { select: { videos: true } },
      },
      orderBy: { createdAt: "desc" },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    
    // [1] Đếm tổng số khóa học khớp điều kiện
    prisma.course.count({ where: query }),

    // [2] Lấy tất cả folder
    prisma.folder.findMany({
      where: {
        classCode: classCode,
        createdBy: teacherId,
      },
      include: {
        _count: {
          select: {
            // Tối ưu 2: Chỉ đếm các khóa học 'isActive: true'
            courses: {
              where: { isActive: true }, 
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    }),

    // [3] Đếm tổng số khóa học (đang active) trong lớp
    prisma.course.count({
      where: {
        classCode: classCode,
        createdBy: teacherId,
        isActive: true, // Chỉ đếm các khóa học active
      },
    }),
  ]);

  // 5. Render component client
  return (
    <VideoList
      data={courses}
      count={count}
      folders={folders}
      allCoursesCount={allCoursesCount}
      page={p}
      classCode={classCode}
      role={role as string} // role chắc chắn tồn tại sau khi check ở đầu
    />
  );
}