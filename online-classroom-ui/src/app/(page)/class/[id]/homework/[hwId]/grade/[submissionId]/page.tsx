import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import HomeworkGradingClient from "@/components/HomeworkGradingClient";
import { serverFetch } from "@/lib/server-api";

interface PageProps {
  params: { id: string; hwId: string; submissionId: string };
}

export default async function HomeworkGradingPage({ params }: PageProps) {
  const user = getCurrentUser();
  
  if (!user || user.role !== 'teacher') {
    redirect("/404");
  }

  let submission: any = null;
  try {
    submission = await serverFetch(`/homework/submissions/detail?utid=${params.submissionId}`);
  } catch (error) {
    console.error("Error fetching submission for grading:", error);
    redirect("/404");
  }

  if (!submission) {
    redirect("/404");
  }

  // Parse answers từ JSON string
  let answers: Record<string | number, string> = {};
  try {
    const parsedContent =
      typeof submission.content === 'string'
        ? JSON.parse(submission.content)
        : submission.content;
    
    if (parsedContent && typeof parsedContent === 'object' && !Array.isArray(parsedContent)) {
      answers = parsedContent;
    } else if (Array.isArray(parsedContent)) {
      answers = {};
      parsedContent.forEach((item: any) => {
        if (item.questionId) {
          answers[item.questionId] = item.answer;
        }
      });
    }
  } catch (error) {
    console.error("Error parsing answers:", error);
  }

  return (
    <HomeworkGradingClient 
      submission={submission}
      answers={answers}
      classId={params.id}
    />
  );
}