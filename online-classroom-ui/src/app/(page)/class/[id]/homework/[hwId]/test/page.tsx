import { TestHomeWork } from "@/components/TestHomeWork";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { serverFetch } from "@/lib/server-api";

export default async function HomeworkTestPage({ params }: { params: { id: string; hwId: number } }) {
  const user = getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  // 1. Lấy thông tin bài tập qua serverFetch
  let homework: any = null;
  try {
    homework = await serverFetch(`/homework/${params.hwId}`);
  } catch (error) {
    console.error("Error fetching homework test:", error);
    redirect("/404");
  }

  if (!homework) {
    redirect("/404");
  }

  // 2. Redirect cho bài tự luận
  if (homework.type === "essay") {
    redirect(`/class/${params.id}/homework/${params.hwId}/essay-test`);
  }

  // Map dữ liệu câu hỏi
  const questions = (homework.questions || []).map((q: any) => ({
    id: q.id,
    content: q.content,
    options: q.options || [],
    point: q.point,
    answer: q.answer,
  }));

  const duration = homework.duration || 30;
  const userId = user.id;
  const role = user.role;

  let currentAttempt = 1;

  // 3. Logic kiểm tra quyền làm bài của học sinh
  if (role === 'student') {
    let countData: any = { count: 0 };
    try {
      countData = await serverFetch(`/homework/submissions/count?homeworkId=${homework.id}`);
    } catch (e) {
      console.error("Error fetching count:", e);
    }

    const submissionCount = countData?.count || 0;
    currentAttempt = submissionCount + 1;
    const maxAttempts = homework.maxAttempts || 1;

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