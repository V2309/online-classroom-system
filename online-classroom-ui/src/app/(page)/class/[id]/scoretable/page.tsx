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
};

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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-foreground">
        <div className="bg-white border border-border rounded-3xl p-8 max-w-md text-center shadow-sm">
          <p className="text-base font-bold text-destructive mb-2">Không tìm thấy lớp học</p>
          <p className="text-xs text-muted-foreground">
            Lớp học không tồn tại hoặc bạn chưa được cấp quyền xem bảng điểm.
          </p>
        </div>
      </div>
    );
  }

  const { classInfo, homeworks = [], studentScores = [], chartData = [], currentStudentId } = data;

  return (
    <div className="bg-background text-foreground min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
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
      </div>
    </div>
  );
}
