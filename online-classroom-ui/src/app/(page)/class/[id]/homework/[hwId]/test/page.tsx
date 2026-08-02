import prisma from "@/lib/prisma";
import { TestHomeWork } from "@/components/TestHomeWork"; //
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomeworkTestPage({ params }: { params: { id: string; hwId: number } }) {
  // 1. Lấy thông tin bài tập
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

  // 2. Redirect cho bài tự luận
  if (homework.type === "essay") {
    redirect(`/class/${params.id}/homework/${params.hwId}/essay-test`);
  }

  // 2. Map dữ liệu câu hỏi
  const questions = homework.questions.map((q: any) => ({
    id: q.id,
    content: q.content,
    options: q.options || [],
    point: q.point,
    answer: q.answer,
  }));

  // DEBUG: Kiểm tra dữ liệu
  console.log("Test Page Debug:", {
    homeworkId: homework.id,
    homeworkType: homework.type,
    questionsFromDB: homework.questions.length,
    mappedQuestions: questions.length,
    firstQuestion: questions[0] || null
  });

  const duration = homework.duration || 30;
  const user = await getCurrentUser();
  
  if (!user) {
      redirect("/login"); // Handle case no user
  }

  const userId = user.id;
  const role = user.role;

  // Biến để xác định đây là lần làm bài thứ mấy
  let currentAttempt = 1;

  // 3. Logic kiểm tra quyền làm bài của học sinh
  if (role === 'student') {
    // Đếm số lần đã làm bài (chỉ đếm các bài đã nộp thành công hoặc đang làm)
    const submissionCount = await prisma.homeworkSubmission.count({
      where: {
        homeworkId: homework.id,
        studentId: userId as string
      }
    });

    // Cập nhật lần làm bài hiện tại (để truyền xuống client reset bộ đếm)
    currentAttempt = submissionCount + 1;

    const maxAttempts = homework.maxAttempts || 1;

    console.log(`CHECK QUYỀN: Đã làm ${submissionCount}/${maxAttempts} lần`);

    // A. Kiểm tra hết lượt
    if (submissionCount >= maxAttempts) {
      // QUAN TRỌNG: Hết lượt thì về trang CHI TIẾT để xem kết quả, không về List
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

    // C. Kiểm tra chặn xem lại (Block View)
    if (homework.blockViewAfterSubmit) {
      const completedSubmission = await prisma.homeworkSubmission.findFirst({
        where: {
          homeworkId: homework.id,
          studentId: userId as string,
          grade: { not: null } // Đã có điểm
        }
      });
      
      if (completedSubmission) {
        // Nếu bị chặn xem lại thì mới về trang List
        redirect(`/class/${params.id}/homework/list?msg=blocked`);
      }
    }
  }
  
  // 4. Xử lý file đề bài
  let fileInfo = {
    fileUrl: "",
    fileType: "",
    fileName: "",
  };

  if (homework.type === "extracted") {
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
    <TestHomeWork
      homework={{
        id: homework.id,
        title: homework.title,
        description: homework.description ?? "",
        duration: homework.duration ?? 30,
        type: homework.type ?? "original",
        ...fileInfo,
      }}
      questions={questions}
      duration={duration}
      userId={userId as string}
      classCode={params.id}
      role={role as string}
      // [QUAN TRỌNG] Truyền key này để React biết đây là lần làm mới -> Reset state/cache
      key={`attempt-${currentAttempt}`} 
    />
  );
}