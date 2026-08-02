
import prisma from "@/lib/prisma";
import Link from "next/link";
import HomeworkListClient from "@/components/HomeworkListClient";
import { getCurrentUser } from "@/lib/auth";

export default async function HomeworkList({ params }: { params: { id: string } }) {
  // Lấy tổng số học sinh trong lớp
  const totalStudents = await prisma.student.count({
    where: {
      classes: {
        some: {
          class_code: params.id
        }
      }
    }
  });

  const homeworks = await prisma.homework.findMany({
    where: { class: { class_code: params.id } },
    include: {
      class: { select: { name: true, class_code: true } },
      subject: { select: { name: true } },
      attachments: true,
      submissions: {
        select: { 
          studentId: true,
          grade: true 
        },
        distinct: ['studentId'] // Chỉ đếm mỗi học sinh một lần
      }
    },
    orderBy: { endTime: "asc" }
  });

  // Thêm thông tin tổng số học sinh và số đã làm vào mỗi homework
  const homeworksWithStats = homeworks.map(hw => ({
    ...hw,
    totalStudents,
    completedStudents: hw.submissions.length
  }));

  const user = await getCurrentUser();
  const role = user?.role;


  return (
    <div className=" bg-white rounded-lg shadow-md flex flex-col h-full">
      <h1 className="text-2xl font-bold px-4 py-4 border-b border-gray-400">Danh sách bài tập</h1>
   
      <HomeworkListClient homeworks={homeworksWithStats} role={role as string}  class_code={params.id}/>
    </div>
  );
}