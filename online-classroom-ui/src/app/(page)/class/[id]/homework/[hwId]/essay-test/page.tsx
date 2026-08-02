import prisma from "@/lib/prisma";
import { EssayTestPage } from "@/components/EssayTestPage";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function EssayHomeworkTestPage({ params }: { params: { id: string; hwId: number } }) {
  // 1. Lấy thông tin bài tập tự luận
  const homework = await prisma.homework.findUnique({
    where: { id: Number(params.hwId) },
    include: {
      questions: true,
      attachments: true,
    },
  });

  if (!homework) {
    redirect("/404");
  }

  // 2. Kiểm tra loại bài tập phải là essay
  if (homework.type !== "essay") {
    redirect(`/class/${params.id}/homework/${params.hwId}/test`);
  }

  // 3. Map dữ liệu câu hỏi tự luận
  const questions = homework.questions.map((q: any) => ({
    id: q.id,
    content: q.content,
    point: q.point || 10,
  }));

  // DEBUG: Kiểm tra dữ liệu
  console.log("Essay Test Page Debug:", {
    homeworkId: homework.id,
    homeworkType: homework.type,
    questionsFromDB: homework.questions.length,
    mappedQuestions: questions.length,
    firstQuestion: questions[0] || null
  });

  const duration = homework.duration || 60; // Default 60 minutes for essay
  const user = await getCurrentUser();
  
  if (!user) {
      redirect("/login");
  }

  const userId = user.id;
  const role = user.role;

  // Biến để xác định đây là lần làm bài thứ mấy
  let currentAttempt = 1;

  // 4. Logic kiểm tra quyền làm bài của học sinh
  if (role === 'student') {
    // Đếm số lần đã làm bài
    const submissionCount = await prisma.homeworkSubmission.count({
      where: {
        homeworkId: homework.id,
        studentId: userId as string
      }
    });

    currentAttempt = submissionCount + 1;
    const maxAttempts = homework.maxAttempts || 1;

    console.log(`CHECK QUYỀN ESSAY: Đã làm ${submissionCount}/${maxAttempts} lần`);

    // A. Kiểm tra hết lượt
    if (submissionCount >= maxAttempts) {
      redirect(`/class/${params.id}/homework/${params.hwId}/detail?msg=max_attempts`);
    }

    // B. Kiểm tra thời gian
    const now = new Date();
    const startTime = homework.startTime ? new Date(homework.startTime) : null;
    const endTime = homework.endTime ? new Date(homework.endTime) : null;

    if (startTime && now < startTime) {
      redirect(`/class/${params.id}/homework/${params.hwId}/detail?msg=not_started`);
    }

    if (endTime && now > endTime) {
      redirect(`/class/${params.id}/homework/${params.hwId}/detail?msg=expired`);
    }

    // C. Kiểm tra chặn xem lại
    if (homework.blockViewAfterSubmit) {
      const completedSubmission = await prisma.homeworkSubmission.findFirst({
        where: {
          homeworkId: homework.id,
          studentId: userId as string,
          grade: { not: null }
        }
      });
      
      if (completedSubmission) {
        redirect(`/class/${params.id}/homework/list?msg=blocked`);
      }
    }
  }
  
  // 5. Xử lý file đề bài
  let fileInfo = {
    fileUrl: "",
    fileType: "",
    fileName: "",
  };

  if (homework.type === "essay") {
    if (homework.originalFileUrl) {
      fileInfo = {
        fileUrl: homework.originalFileUrl,
        fileType: homework.originalFileType ?? "",
        fileName: homework.originalFileName ?? "",
      };
    }
  } else {
    const file = homework.attachments?.[0];
    if (file) {
      fileInfo = {
        fileUrl: file.url ?? "",
        fileType: file.type ?? "",
        fileName: file.name ?? "",
      };
    }
  }

  return (
    <EssayTestPage
      homework={{
        id: homework.id,
        title: homework.title,
        description: homework.description ?? "",
        duration: homework.duration ?? 60,
        type: homework.type ?? "essay",
        ...fileInfo,
      }}
      questions={questions}
      duration={duration}
      userId={userId as string}
      classCode={params.id}
      role={role as string}
      key={`essay-attempt-${currentAttempt}`}
    />
  );
}