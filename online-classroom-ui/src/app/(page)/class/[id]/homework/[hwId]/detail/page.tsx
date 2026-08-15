import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import HomeworkDetailClient from "@/components/HomeworkDetailClient";
import { serverFetch } from "@/lib/server-api";

interface PageProps {
  params: { id: string; hwId: string };
  searchParams: { utid?: string; homeworkId?: string; getBest?: string };
}

export default async function HomeworkDetail({ params, searchParams }: PageProps) {
  const user = getCurrentUser();
  
  if (!user || user.role !== 'student') {
    redirect("/404");
  }

  let submission: any = null;

  try {
    if (searchParams.utid) {
      submission = await serverFetch(`/homework/submissions/detail?utid=${searchParams.utid}`);
    } else if (searchParams.homeworkId && searchParams.getBest) {
      submission = await serverFetch(`/homework/submissions/detail?homeworkId=${searchParams.homeworkId}&getBest=true`);
    } else {
      redirect("/404");
    }
  } catch (error) {
    console.error("Error fetching submission detail:", error);
    redirect("/404");
  }

  if (!submission) {
    redirect("/404");
  }

  // Parse answers cho bài tự luận nếu cần
  let parsedAnswers = null;
  if (submission.homework?.type === 'essay' && submission.content) {
    try {
      parsedAnswers = typeof submission.content === 'string' ? JSON.parse(submission.content) : submission.content;
    } catch (error) {
      console.error("Error parsing essay answers:", error);
    }
  }

  return <HomeworkDetailClient submission={submission} parsedAnswers={parsedAnswers} />;
}