import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const homeworkId = searchParams.get("homeworkId");

    if (!homeworkId) {
      return NextResponse.json({ success: false, error: "Homework ID is required" }, { status: 400 });
    }

    const count = await prisma.homeworkSubmission.count({
      where: {
        homeworkId: parseInt(homeworkId),
        studentId: user.id as string,
      },
    });

    // Lấy thông tin homework để kiểm tra quyền xem điểm
    const homework = await prisma.homework.findUnique({
      where: { id: parseInt(homeworkId) },
      select: {
        studentViewPermission: true,
        gradingMethod: true,
        endTime: true
      }
    });

    if (!homework) {
      return NextResponse.json({ success: false, error: "Homework not found" }, { status: 404 });
    }

    // Kiểm tra quyền xem điểm và thời gian hết hạn
    const isExpired = homework.endTime ? new Date() > new Date(homework.endTime) : false;
    const canViewScore = homework.studentViewPermission !== 'NO_VIEW' || isExpired;

    let currentSubmission = null;
    if (canViewScore) {
      // Lấy submission theo phương pháp tính điểm đã cấu hình
      let orderBy;
      switch (homework.gradingMethod) {
        case 'FIRST_ATTEMPT':
          orderBy = { submittedAt: 'asc' as const };
          break;
        case 'LATEST_ATTEMPT':
          orderBy = { submittedAt: 'desc' as const };
          break;
        case 'HIGHEST_ATTEMPT':
        default:
          orderBy = { grade: 'desc' as const };
          break;
      }

      currentSubmission = await prisma.homeworkSubmission.findFirst({
        where: {
          homeworkId: parseInt(homeworkId),
          studentId: user.id as string,
          grade: { not: null }, // Chỉ lấy submission đã được chấm điểm
        },
        orderBy,
        select: {
          id: true,
          grade: true,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      count,
      bestSubmissionId: canViewScore ? (currentSubmission?.id || null) : null,
      bestGrade: canViewScore ? (currentSubmission?.grade || null) : null
    });
  } catch (error) {
    console.error("Error counting submissions:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
} 