
import Link from "next/link";
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
    <div className="bg-white rounded-lg shadow-md flex flex-col h-full">
      <ClassPageHeader title="Danh sách bài tập" />
   
      <HomeworkListClient homeworks={homeworksWithStats || []} role={role as string} class_code={params.id}/>
    </div>
  );
}