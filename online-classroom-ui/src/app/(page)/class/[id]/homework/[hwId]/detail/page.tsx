import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import HomeworkDetailClient from "@/components/HomeworkDetailClient";

interface PageProps {
  params: { id: string; hwId: string };
  searchParams: { utid?: string; homeworkId?: string; getBest?: string };
}

// Helper functions để kiểm tra loại file
function isPDF(fileType: string | null, fileName?: string | null) {
  if (!fileType) return false;
  return fileType === "application/pdf" || fileName?.toLowerCase().endsWith(".pdf");
}

function isWord(fileType: string | null, fileName?: string | null) {
  if (!fileType) return false;
  const lowerFileName = fileName?.toLowerCase();
  return fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
         fileType === "application/msword" ||
         lowerFileName?.endsWith(".doc") ||
         lowerFileName?.endsWith(".docx");
}

export default async function HomeworkDetail({ params, searchParams }: PageProps) {
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'student') {
    redirect("/404");
  }

  let submission;

  if (searchParams.utid) {
    // Lấy submission cụ thể theo ID
    submission = await prisma.homeworkSubmission.findUnique({
      where: { id: Number(searchParams.utid) },
      include: {
        questionAnswers: {
          include: {
            question: true,
          },
        },
        attachments: true,
        homework: {
          include: {
            attachments: true,
            questions: true, // Thêm questions để hỗ trợ bài tự luận
          },
        }
      },
    });
  } else if (searchParams.homeworkId && searchParams.getBest) {
    // Lấy submission có điểm cao nhất
    submission = await prisma.homeworkSubmission.findFirst({
      where: {
        homeworkId: Number(searchParams.homeworkId),
        studentId: user.id as string,
        grade: { not: null }
      },
      include: {
        questionAnswers: {
          include: {
            question: true,
          },
        },
        attachments: true,
        homework: {
          include: {
            attachments: true,
            questions: true, // Thêm questions để hỗ trợ bài tự luận
          },
        }
      },
      orderBy: {
        grade: 'desc'
      }
    });
  } else {
    redirect("/404");
  }

  if (!submission) {
    redirect("/404");
  }

  // Parse answers cho bài tự luận nếu cần
  let parsedAnswers = null;
  if (submission.homework.type === 'essay') {
    try {
      parsedAnswers = JSON.parse(submission.content);
      console.log("Essay Detail Debug:", {
        submissionId: submission.id,
        homeworkType: submission.homework.type,
        questionsCount: submission.homework.questions?.length || 0,
        parsedAnswers: Object.keys(parsedAnswers || {}).length
      });
    } catch (error) {
      console.error("Error parsing essay answers:", error);
    }
  }

  // Debug log để kiểm tra dữ liệu
  console.log("Detail Page Debug:", {
    submissionId: submission.id,
    homeworkType: submission.homework.type,
    questionAnswersCount: submission.questionAnswers?.length || 0,
    hasQuestionAnswers: !!submission.questionAnswers,
    questionAnswersData: submission.questionAnswers,
    homeworkQuestions: submission.homework.questions,
    searchParams,
    homeworkId: submission.homeworkId
  });

  return <HomeworkDetailClient submission={submission} parsedAnswers={parsedAnswers} />;
}