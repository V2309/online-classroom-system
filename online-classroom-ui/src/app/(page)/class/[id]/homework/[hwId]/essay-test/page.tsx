import { EssayTestPage } from "@/components/EssayTestPage";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { serverFetch } from "@/lib/server-api";

export default async function EssayHomeworkTestPage({ params }: { params: { id: string; hwId: number } }) {
  const user = getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  // 1. Lấy thông tin bài tập tự luận qua serverFetch
  let homework: any = null;
  try {
    homework = await serverFetch(`/homework/${params.hwId}`);
  } catch (error) {
    console.error("Error fetching essay homework:", error);
    redirect("/404");
  }

  if (!homework) {
    redirect("/404");
  }

  // 2. Kiểm tra loại bài tập phải là essay
  if (homework.type !== "essay") {
    redirect(`/class/${params.id}/homework/${params.hwId}/test`);
  }

  // 3. Map dữ liệu câu hỏi tự luận
  const questions = (homework.questions || []).map((q: any) => ({
    id: q.id,
    content: q.content,
    point: q.point || 10,
  }));

  const duration = homework.duration || 60;
  const userId = user.id;
  const role = user.role;

  let currentAttempt = 1;

  // 4. Logic kiểm tra quyền làm bài của học sinh
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