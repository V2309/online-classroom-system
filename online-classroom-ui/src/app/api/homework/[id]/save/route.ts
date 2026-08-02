import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { answers, userId, isPartial = true } = await request.json();
    const homeworkId = parseInt(params.id);

    // Kiểm tra bài tập có tồn tại không
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: { questions: true }
    });

    if (!homework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    // Tìm submission hiện tại của student cho homework này
    let submission = await prisma.homeworkSubmission.findFirst({
      where: {
        homeworkId,
        studentId: userId,
        grade: null // Chỉ lấy submission chưa được chấm điểm (đang làm dở)
      }
    });

    if (!submission) {
      // Tạo submission mới
      submission = await prisma.homeworkSubmission.create({
        data: {
          homeworkId,
          studentId: userId,
          content: JSON.stringify(answers), // Store answers as JSON string
          attemptNumber: 1,
          submittedAt: new Date(),
          timeSpent: 0
        }
      });
    } else {
      // Cập nhật submission hiện tại
      submission = await prisma.homeworkSubmission.update({
        where: { id: submission.id },
        data: {
          content: JSON.stringify(answers),
          submittedAt: new Date()
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      submissionId: submission.id,
      message: isPartial ? "Đã lưu bản nháp" : "Đã lưu bài làm"
    });

  } catch (error) {
    console.error("Save homework error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}