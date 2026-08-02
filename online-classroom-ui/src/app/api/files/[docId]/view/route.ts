

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Import instance Prisma chuẩn của bạn

// ⚠️ Dòng này CỰC KỲ QUAN TRỌNG để tránh lỗi "Failed to collect page data"
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { docId: string } }
) {
  try {
    const fileId = params.docId;
    if (!fileId) {
       return NextResponse.json({ error: "Missing docId" }, { status: 400 });
    }

    // 2. Lấy classCode từ file
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: { classCode: true },
    });

    if (!file || !file.classCode) {
      return NextResponse.json(
        { error: "File not found or not in a class" },
        { status: 404 }
      );
    }

    const classCode = file.classCode;

    // 3. Lấy danh sách ID học sinh HIỆN TẠI trong lớp
    const classInfo = await prisma.class.findUnique({
      where: { class_code: classCode },
      select: {
        students: {
          select: { id: true },
        },
      },
    });

    if (!classInfo) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const currentStudentIds = classInfo.students.map((s) => s.id);

    // 4. Tính toán số liệu thống kê
    // Sử dụng transaction để tối ưu query
    const [studentViewsCount, totalViewsCount] = await prisma.$transaction([
      // Đếm lượt xem chỉ từ học sinh HIỆN TẠI
      prisma.fileView.count({
        where: {
          fileId: fileId,
          user: {
            student: {
              id: { in: currentStudentIds },
            },
          },
        },
      }),
      // Đếm TẤT CẢ lượt xem (bao gồm cả giáo viên, học sinh cũ...)
      prisma.fileView.count({
        where: {
          fileId: fileId,
        },
      }),
    ]);

    const stats = {
      totalViews: totalViewsCount,
      studentViews: studentViewsCount,
      totalStudents: currentStudentIds.length,
    };

    // 5. Lấy danh sách chi tiết người xem
    const allViews = await prisma.fileView.findMany({
      where: {
        fileId: fileId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            student: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: {
        viewedAt: "desc", // Mới nhất lên đầu
      },
    });

    // 6. Xử lý dữ liệu trả về
    const viewers = allViews.map((view) => {
      const isStudent = view.user.role === "student";
      const studentId = view.user.student?.id;

      // Kiểm tra xem học sinh này có còn trong lớp không
      const isStillInClass =
        view.user.role === "teacher" ||
        (isStudent && studentId && currentStudentIds.includes(studentId));

      return {
        id: view.userId,
        username: view.user.username,
        role: view.user.role,
        viewedAt: view.viewedAt,
        isStillInClass: isStillInClass, // boolean
      };
    });

    // 7. Trả về kết quả thành công
    return NextResponse.json({
      success: true,
      stats,
      viewers,
    });

  } catch (error) {
    // Log lỗi ra server console (Vercel logs)
    console.error("[API_VIEW_ERROR]", error);
    
    // Trả về lỗi 500 chứ không để sập
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}