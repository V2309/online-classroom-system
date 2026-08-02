import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Kiểm tra authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const homeworkId = parseInt(params.id);
    if (isNaN(homeworkId)) {
      return NextResponse.json({ error: "Invalid homework ID" }, { status: 400 });
    }

    // Lấy thông tin homework từ database
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      select: {
        id: true,
        title: true,
        originalFileUrl: true,
        originalFileName: true,
        originalFileType: true,
        teacherId: true,
        class: {
          select: {
            class_code: true,
            students: {
              select: { id: true }
            }
          }
        }
      }
    });

    if (!homework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    // Kiểm tra quyền truy cập
    const isTeacher = homework.teacherId === user.id;
    const isStudent = homework.class?.students?.some(student => student.id === user.id);

    if (!isTeacher && !isStudent) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Kiểm tra có file để download không
    if (!homework.originalFileUrl) {
      return NextResponse.json({ 
        error: "Không có file để tải về" 
      }, { status: 404 });
    }

    // Trả về thông tin file để client download
    return NextResponse.json({
      success: true,
      fileUrl: homework.originalFileUrl,
      fileName: homework.originalFileName || `${homework.title}.pdf`,
      fileType: homework.originalFileType || "application/pdf"
    });

  } catch (error) {
    console.error("Download API error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}