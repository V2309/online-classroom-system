import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { homeworkId, studentId, answers, file, role, violationCount } = body;

  // Kiểm tra xem userId có tồn tại không (có thể là student hoặc teacher)
  let user = null;
  let isTeacher = role === 'teacher';
  
  if (isTeacher) {
    // Nếu là teacher, kiểm tra trong bảng Teacher
    user = await prisma.teacher.findUnique({
      where: { id: studentId },
    });
  } else {
    // Nếu là student, kiểm tra trong bảng Student
    user = await prisma.student.findUnique({
      where: { id: studentId },
    });
  }

  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: `${isTeacher ? 'Teacher' : 'Student'} không tồn tại.` }),
      { status: 400 }
    );
  }

  // Lấy danh sách câu hỏi của bài tập
  const questions = await prisma.question.findMany({
    where: { homeworkId },
  });

  // Tính attempt number cho student
  let attemptNumber = 1;
  if (!isTeacher) {
    const existingSubmissions = await prisma.homeworkSubmission.findMany({
      where: {
        homeworkId,
        studentId,
        attemptNumber: { gt: 0 }, // Chỉ đếm các lần làm bài thật sự
      },
    });
    attemptNumber = existingSubmissions.length + 1;
  }

  let totalPoints = 0;
  const questionAnswers: { questionId: number; answer: string; isCorrect: boolean }[] = [];

  // Chấm điểm từng câu hỏi
  questions.forEach((question) => {
    const studentAnswer = answers[question.id];
    const isCorrect = studentAnswer === question.answer;
    if (isCorrect) {
      totalPoints += question.point || 0;
    }

    questionAnswers.push({
      questionId: question.id,
      answer: studentAnswer || "",
      isCorrect,
    });
  });

  // Nếu là giáo viên, chỉ trả về kết quả mà không lưu vào database
  if (isTeacher) {
    return new Response(JSON.stringify({ 
      success: true, 
      isTeacher: true,
      totalPoints: Math.round(totalPoints * 100) / 100, // Làm tròn 2 chữ số thập phân
      questionAnswers,
      message: "Kết quả làm thử của giáo viên (không lưu vào hệ thống)"
    }), {
      status: 200,
    });
  }

  // Chỉ lưu vào database khi là học sinh
  const submission = await prisma.homeworkSubmission.create({
    data: {
      content: "Bài làm của học sinh",
      attemptNumber: attemptNumber,
      timeSpent: body.timeSpent, // Thời gian làm bài (tính bằng giây)
      homework: { connect: { id: homeworkId } },
      student: { connect: { id: studentId } },
      grade: Math.round(totalPoints * 100) / 100, // Làm tròn 2 chữ số thập phân
      violationCount: violationCount || 0,
      questionAnswers: {
        create: questionAnswers,
      },
      ...(file ? {
        attachments: {
          create: {
            name: file.name,
            type: file.type,
            url: file.url,
            size: file.size || 0, // Kích thước file (nếu có)
          },
        },
      } : {}),
    },
  });

  return new Response(JSON.stringify({ success: true, submission }), {
    status: 200,
  });
}
