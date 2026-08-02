// lib/class-access.ts
import prisma from "@/lib/prisma";
import type { User } from "@prisma/client"; // Import kiểu User

type AccessCheckResult = {
  hasAccess: false;
  message: string;
  teacherId: null;
} | {
  hasAccess: true;
  message: string;
  teacherId: string; // Luôn trả về ID của giáo viên quản lý lớp
};

/**
 * Kiểm tra quyền truy cập của người dùng vào một lớp học.
 * @param user Đối tượng người dùng (từ getCurrentUser)
 * @param classCode Mã lớp học (từ params)
 * @returns {Promise<AccessCheckResult>}
 */
export async function checkClassAccess(
  user: User | null,
  classCode: string
): Promise<AccessCheckResult> {
  // 1. Kiểm tra người dùng cơ bản
  if (!user || (user.role !== "teacher" && user.role !== "student")) {
    return {
      hasAccess: false,
      message: "Bạn không có quyền truy cập.",
      teacherId: null,
    };
  }

  // 2. Xử lý logic cho Giáo viên
  if (user.role === "teacher") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
    });
    if (!teacher) {
      return {
        hasAccess: false,
        message: "Không tìm thấy thông tin giáo viên.",
        teacherId: null,
      };
    }

    const classRoom = await prisma.class.findFirst({
      where: {
        class_code: classCode,
        supervisorId: teacher.id,
        deleted: false,
      },
    });

    if (!classRoom) {
      return {
        hasAccess: false,
        message: "Không tìm thấy lớp học hoặc bạn không có quyền truy cập.",
        teacherId: null,
      };
    }
    // Giáo viên có quyền, trả về ID của chính họ
    return { hasAccess: true, message: "Access granted", teacherId: teacher.id };
  }

  // 3. Xử lý logic cho Học sinh
  // (user.role === "student")
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
  });
  if (!student) {
    return {
      hasAccess: false,
      message: "Không tìm thấy thông tin học sinh.",
      teacherId: null,
    };
  }

  const classRoom = await prisma.class.findFirst({
    where: {
      class_code: classCode,
      deleted: false,
      students: { some: { id: student.id } },
    },
  });

  if (!classRoom || !classRoom.supervisorId) {
    return {
      hasAccess: false,
      message: "Không tìm thấy lớp học hoặc bạn không có quyền truy cập.",
      teacherId: null,
    };
  }

  // Học sinh có quyền, trả về ID của giáo viên (supervisor) của lớp đó
  return {
    hasAccess: true,
    message: "Access granted",
    teacherId: classRoom.supervisorId,
  };
}