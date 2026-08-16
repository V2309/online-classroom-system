import HomeworkListClient from "@/components/HomeworkListClient";
import { getCurrentUser } from "@/lib/auth-server";
import { serverFetch } from "@/lib/server-api";
import ClassPageHeader from "@/components/ClassPageHeader";

export default async function HomeworkList({ params }: { params: { id: string } }) {
  const user = getCurrentUser();
  const role = user?.role;

  let homeworksWithStats: any[] = [];
  try {
    homeworksWithStats = await serverFetch(`/homework/class/${params.id}`);
  } catch (error) {
    console.error("Error fetching class homeworks:", error);
  }

  return (
    <div className="bg-background text-foreground h-full w-full flex flex-col overflow-hidden transition-colors">
      <ClassPageHeader title="Danh sách bài tập" className="sticky top-0 z-40 flex-shrink-0" />
      <div className="flex-1 w-full p-4 sm:p-6 overflow-hidden min-h-0">
        <HomeworkListClient 
          homeworks={homeworksWithStats || []} 
          role={role as string} 
          class_code={params.id}
        />
      </div>
    </div>
  );
}