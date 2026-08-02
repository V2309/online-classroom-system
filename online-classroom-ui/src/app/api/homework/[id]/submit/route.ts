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

    const { answers, userId, timeSpent } = await request.json();
    const homeworkId = parseInt(params.id);

    // Kiểm tra bài tập có tồn tại không
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: { questions: true }
    });

    if (!homework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    // Kiểm tra đã hết lượt làm bài chưa
    const submissionCount = await prisma.homeworkSubmission.count({
      where: {
        homeworkId,
        studentId: userId,
        // Đối với essay: đã nộp là đã có submission (kể cả grade = null)
        // Đối với trắc nghiệm: đã được chấm điểm 
        ...(homework.type === "essay" ? {} : { grade: { not: null } })
      }
    });

    const maxAttempts = homework.maxAttempts || 1;
    if (submissionCount >= maxAttempts) {
      return NextResponse.json(
        { error: "Đã hết lượt làm bài" },
        { status: 400 }
      );
    }

    // Tìm submission hiện tại hoặc tạo mới
    let submission = await prisma.homeworkSubmission.findFirst({
      where: {
        homeworkId,
        studentId: userId,
        grade: null // Chưa được chấm điểm
      }
    });

    if (!submission) {
      // Tạo submission mới
      submission = await prisma.homeworkSubmission.create({
        data: {
          homeworkId,
          studentId: userId,
          content: JSON.stringify(answers),
          attemptNumber: submissionCount + 1,
          submittedAt: new Date(),
          timeSpent: timeSpent || 0,
          grade: null // Chờ giáo viên chấm thủ công
        }
      });
    } else {
      // Cập nhật submission để hoàn thành
      submission = await prisma.homeworkSubmission.update({
        where: { id: submission.id },
        data: {
          content: JSON.stringify(answers),
          submittedAt: new Date(),
          timeSpent: timeSpent || 0,
          grade: null // Chờ giáo viên chấm thủ công
        }
      });
    }

    // Tự động chấm điểm cho bài tự luận (có thể để null và chấm thủ công sau)
    // Hoặc có thể dùng AI để chấm sơ bộ
    let autoGrade = null;
    if (homework.type === "essay") {
      // Có thể implement auto grading với AI ở đây
      // autoGrade = await gradeEssayWithAI(answers, homework.questions);
    }

    if (autoGrade !== null) {
      await prisma.homeworkSubmission.update({
        where: { id: submission.id },
        data: { grade: autoGrade }
      });
    }

    return NextResponse.json({ 
      success: true, 
      submissionId: submission.id,
      grade: autoGrade,
      message: homework.type === "essay" ? "Nộp bài thành công. Chờ giáo viên chấm điểm." : "Nộp bài thành công"
    });

  } catch (error) {
    console.error("Submit homework error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}