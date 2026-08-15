import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import HomeworkTeacherDetailClient from "@/components/HomeworkTeacherDetailClient";
import { serverFetch } from "@/lib/server-api";

// Force dynamic rendering để luôn fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: { id: string; hwId: string };
}

export default async function HomeworkTeacherDetail({ params }: PageProps) {
  const user = getCurrentUser();
  
  if (!user || user.role !== 'teacher') {
    redirect("/404");
  }

  let data: any = null;
  try {
    data = await serverFetch(`/homework/${params.hwId}/teacher-detail`);
  } catch (error) {
    console.error("Error fetching teacher detail:", error);
    redirect("/404");
  }

  if (!data?.homework) {
    redirect("/404");
  }

  return (
    <HomeworkTeacherDetailClient 
      homework={data.homework} 
      submissions={data.submissions || []} 
      allStudents={data.allStudents || []}
      classId={params.id}
    />
  );
}