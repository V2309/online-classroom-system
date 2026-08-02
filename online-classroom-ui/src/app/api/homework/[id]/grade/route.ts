import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { submissionId, grade, feedback, questionGrades } = await request.json();
    const homeworkId = parseInt(params.id);

    // Kiểm tra bài tập có tồn tại không
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
    });

    if (!homework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    // Chuẩn bị dữ liệu điểm từng câu để lưu vào content
    const gradeData: Record<string, any> = {};
    
    if (questionGrades) {
      Object.entries(questionGrades).forEach(([questionId, score]) => {
        gradeData[questionId] = {
          score: Number(score),
          feedback: null // Có thể mở rộng sau để lưu feedback từng câu
        };
      });
    }

    // Parse content hiện tại để giữ lại answers
    let currentContent: any = {};
    try {
      const submission = await prisma.homeworkSubmission.findUnique({
        where: { id: Number(submissionId) }
      });
      
      if (submission?.content) {
        if (typeof submission.content === 'string') {
          currentContent = JSON.parse(submission.content);
        } else {
          currentContent = submission.content;
        }
      }
    } catch (error) {
      console.error("Error parsing current content:", error);
    }

    // Merge answers với grades
    Object.entries(gradeData).forEach(([questionId, gradeInfo]) => {
      // Kiểm tra xem currentContent[questionId] có phải là string (câu trả lời) không
      if (typeof currentContent[questionId] === 'string') {
        // Nếu là string (câu trả lời), chuyển thành object với answer và score
        const answerText = currentContent[questionId];
        currentContent[questionId] = {
          answer: answerText,
          score: gradeInfo.score,
          feedback: gradeInfo.feedback || null
        };
      } else if (typeof currentContent[questionId] === 'object' && currentContent[questionId] !== null) {
        // Nếu đã là object, chỉ cập nhật score và feedback
        currentContent[questionId].score = gradeInfo.score;
        if (gradeInfo.feedback) {
          currentContent[questionId].feedback = gradeInfo.feedback;
        }
      } else {
        // Nếu chưa có dữ liệu, tạo object mới chỉ với score
        currentContent[questionId] = {
          score: gradeInfo.score,
          feedback: gradeInfo.feedback || null
        };
      }
    });

    // Cập nhật điểm và feedback cho submission
    const updatedSubmission = await prisma.homeworkSubmission.update({
      where: { id: Number(submissionId) },
      data: {
        grade: Number(grade),
        feedback: feedback || null,
        content: JSON.stringify(currentContent), // Lưu cả answers và scores
      }
    });

    // Revalidate trang teacher-detail để refresh dữ liệu
    const homeworkWithClass = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: { class: true }
    });
    
    if (homeworkWithClass?.class?.class_code) {
      revalidatePath(`/class/${homeworkWithClass.class.class_code}/homework/${homeworkId}/teacher-detail`);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Đã chấm điểm thành công",
      submission: updatedSubmission
    });

  } catch (error) {
    console.error("Grade homework error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}