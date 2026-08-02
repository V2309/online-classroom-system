import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import HomeworkGradingClient from "@/components/HomeworkGradingClient";

interface PageProps {
  params: { id: string; hwId: string; submissionId: string };
}


export default async function HomeworkGradingPage({ params }: PageProps) {
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'teacher') {
    redirect("/404");
  }

  // Lấy thông tin submission cần chấm
  const submission = await prisma.homeworkSubmission.findUnique({
    where: { id: Number(params.submissionId) },
    include: {
      student: true,
      homework: {
        include: {
          questions: true,
          class: true,
        },
      },
    },
  });

  if (!submission) {
    redirect("/404");
  }

  // Parse answers từ JSON string
  let answers: Record<string | number, string> = {};
  try {
    const parsedContent = JSON.parse(submission.content);
    console.log("DEBUG parsed content:", parsedContent);
    
    // Kiểm tra nếu parsedContent là object với key là questionId
    if (parsedContent && typeof parsedContent === 'object' && !Array.isArray(parsedContent)) {
      answers = parsedContent;
    } else if (Array.isArray(parsedContent)) {
      // Nếu là array thì convert thành object
      answers = {};
      parsedContent.forEach((item: any) => {
        if (item.questionId) {
          answers[item.questionId] = item.answer;
        }
      });
    } else {
      console.warn("Unexpected content structure:", parsedContent);
    }
  } catch (error) {
    console.error("Error parsing answers:", error, "Raw content:", submission.content);
  }

  return (
    <HomeworkGradingClient 
      submission={submission}
      answers={answers}
      classId={params.id}
    />
  );
}