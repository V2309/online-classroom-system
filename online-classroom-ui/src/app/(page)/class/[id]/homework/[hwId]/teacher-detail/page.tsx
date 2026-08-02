import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import HomeworkTeacherDetailClient from "@/components/HomeworkTeacherDetailClient";

// Force dynamic rendering để luôn fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: { id: string; hwId: string };
}

export default async function HomeworkTeacherDetail({ params }: PageProps) {
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'teacher') {
    redirect("/404");
  }

  // Lấy thông tin bài tập
  const homework = await prisma.homework.findUnique({
    where: { id: Number(params.hwId) },
    include: {
      questions: true,
      attachments: true,
      class: true,
      subject: true,
    },
  });

  if (!homework) {
    redirect("/404");
  }

  // Lấy danh sách submissions của học sinh
  const submissions = await prisma.homeworkSubmission.findMany({
    where: {
      homeworkId: Number(params.hwId),
    },
    include: {
      student: true,
    },
    orderBy: {
      submittedAt: 'desc',
    },
  });

  // Lấy danh sách tất cả học sinh trong lớp để hiển thị ai chưa làm
  const classInfo = await prisma.class.findUnique({
    where: { class_code: params.id },
    include: {
      students: true,
    },
  });
  
  console.log("Teacher Detail Debug:", {
    classCode: params.id,
    classInfo: !!classInfo,
    studentsCount: classInfo?.students?.length || 0,
    homeworkId: params.hwId
  });
  
  const allStudents = classInfo?.students || [];

  if (!classInfo) {
    console.error("Class not found:", params.id);
    redirect("/404");
  }

  return (
    <HomeworkTeacherDetailClient 
      homework={homework} 
      submissions={submissions} 
      allStudents={allStudents}
      classId={params.id}
    />
  );
}