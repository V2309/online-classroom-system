
// page/scoretable.tsx
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ScorePageClient from "@/components/ScorePageClient"; // 1. Import component client mới

// --- INTERFACES (Giữ nguyên) ---
export interface StudentScore {
  id: string;
  username: string;
  schoolname: string | null;
  class_name: string | null;
  homeworkScores: { [homeworkId: string]: number | null }; 
  average: number;
}

// Kiểu dữ liệu Homework
// (Bạn nên tạo file type riêng, nhưng để tạm ở đây)
export type HomeworkData = {
  id: number; // Sửa từ string thành number để match với Prisma
  title: string;
  points: number | null;
  gradingMethod: string | null;
}

export default async function ScoreTablePage({ params }: { params: { id: string } }) {
  // --- DATA FETCHING (Giữ nguyên toàn bộ logic đã tối ưu của bạn) ---
  const user = await getCurrentUser();
  if (!user) redirect("/");

  // Kiểm tra quyền truy cập cho cả teacher và student
  let hasAccess = false;
  if (user.role === "teacher") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id as string } });
    if (teacher) {
      const classAccess = await prisma.class.findUnique({
        where: { class_code: params.id, supervisorId: teacher.id }
      });
      hasAccess = !!classAccess;
    }
  } else if (user.role === "student") {
    const student = await prisma.student.findUnique({ where: { userId: user.id as string } });
    if (student) {
      const classAccess = await prisma.class.findFirst({
        where: { 
          class_code: params.id,
          students: { some: { id: student.id } }
        }
      });
      hasAccess = !!classAccess;
    }
  }

  if (!hasAccess) redirect("/");
  
  const [classInfo, homeworks, students, allSubmissions] = await Promise.all([
    prisma.class.findUnique({
      where: { class_code: params.id },
      select: { id: true, name: true }
    }),
    prisma.homework.findMany({
      where: { classCode: params.id },
      select: { id: true, title: true, points: true, gradingMethod: true },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.student.findMany({
      where: { classes: { some: { class_code: params.id } } },
      select: { id: true, username: true, schoolname: true, class_name: true },
      orderBy: { username: 'asc' }
    }),
    prisma.homeworkSubmission.findMany({
      where: { homework: { classCode: params.id } },
      select: { studentId: true, homeworkId: true, grade: true, submittedAt: true },
      orderBy: { submittedAt: 'asc' } // Sắp xếp theo thời gian để xử lý gradingMethod
    })
  ]);

  if (!classInfo) {
    return <div className="p-8 text-center text-red-500">Không tìm thấy lớp học...</div>;
  }
  
  // Tạo function để tính điểm theo gradingMethod
  const getScoreByGradingMethod = (studentId: string, homeworkId: number, gradingMethod: string | null) => {
    const studentSubmissions = allSubmissions.filter(
      sub => sub.studentId === studentId && sub.homeworkId === homeworkId && sub.grade !== null
    );

    if (studentSubmissions.length === 0) return null;

    switch (gradingMethod) {
      case 'FIRST_ATTEMPT':
        return studentSubmissions[0].grade; // Đầu tiên (đã sort asc)
      case 'LATEST_ATTEMPT':
        return studentSubmissions[studentSubmissions.length - 1].grade; // Cuối cùng
      case 'HIGHEST_ATTEMPT':
      default:
        return Math.max(...studentSubmissions.map(sub => sub.grade!));
    }
  };

  const studentScores: StudentScore[] = students.map(student => {
    const homeworkScores: { [homeworkId: string]: number | null } = {};
    let totalPoints = 0;
    let gradedHomeworks = 0;
    homeworks.forEach(homework => {
      const score = getScoreByGradingMethod(student.id, homework.id, homework.gradingMethod);
      if (score !== null) {
        homeworkScores[homework.id.toString()] = score;
        totalPoints += score;
        gradedHomeworks++;
      } else {
        homeworkScores[homework.id.toString()] = null;
      }
    });
    const average = gradedHomeworks > 0 ? totalPoints / gradedHomeworks : 0;
    return { ...student, homeworkScores, average };
  });
  
  studentScores.sort((a, b) => b.average - a.average);

  const chartData = homeworks.map(homework => {
    let totalScore = 0;
    let scoreCount = 0;
    studentScores.forEach(student => {
      const score = student.homeworkScores[homework.id];
      if (score !== null) {
          totalScore += score;
          scoreCount++;
      }
    });
    const average = scoreCount > 0 ? (totalScore / scoreCount) : 0;
    
    return {
      name: (homework.title.length > 15 ? homework.title.substring(0, 15) + "..." : homework.title),
      "Điểm TB": parseFloat(average.toFixed(1))
    };
  });

  // Tìm student ID nếu user là student
  let currentStudentId: string | undefined;
  if (user.role === 'student') {
    const currentStudent = await prisma.student.findUnique({
      where: { userId: user.id as string },
      select: { id: true }
    });
    currentStudentId = currentStudent?.id;
  }

  // --- RENDER ---
  // 2. Render Client Component và truyền data xuống
  return (
    <ScorePageClient
      classInfo={classInfo}
      chartData={chartData}
      studentScores={studentScores}
      homeworks={homeworks}
      studentCount={students.length}
      homeworkCount={homeworks.length}
      currentUserId={currentStudentId}
      userRole={user.role?.toString()}
    />
  );
}

