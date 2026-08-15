// page/scoretable.tsx
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import ScorePageClient from "@/components/ScorePageClient";
import { serverFetch } from "@/lib/server-api";

export interface StudentScore {
  id: string;
  username: string;
  schoolname: string | null;
  class_name: string | null;
  homeworkScores: { [homeworkId: string]: number | null }; 
  average: number;
}

export type HomeworkData = {
  id: number;
  title: string;
  points: number | null;
  gradingMethod: string | null;
}

export default async function ScoreTablePage({ params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) redirect("/");

  let data: any = null;
  try {
    data = await serverFetch(`/homework/class/${params.id}/scoretable`);
  } catch (error) {
    console.error("Error fetching scoretable:", error);
    redirect("/");
  }

  if (!data?.classInfo) {
    return <div className="p-8 text-center text-red-500">Không tìm thấy lớp học...</div>;
  }

  const { classInfo, homeworks = [], studentScores = [], chartData = [], currentStudentId } = data;

  return (
    <ScorePageClient
      classInfo={classInfo}
      chartData={chartData}
      studentScores={studentScores}
      homeworks={homeworks}
      studentCount={studentScores.length}
      homeworkCount={homeworks.length}
      currentUserId={currentStudentId}
      userRole={user.role?.toString()}
    />
  );
}
