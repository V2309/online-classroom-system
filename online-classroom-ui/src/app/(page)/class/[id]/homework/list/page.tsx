import HomeworkListClient from "@/components/HomeworkListClient";
import { getCurrentUser } from "@/lib/auth-server";
import { serverFetch } from "@/lib/server-api";

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
    <div className="h-full w-full p-4 sm:p-5 flex flex-col overflow-hidden bg-background text-foreground">
      <HomeworkListClient
        homeworks={homeworksWithStats || []}
        role={role as string}
        class_code={params.id}
      />
    </div>
  );
}