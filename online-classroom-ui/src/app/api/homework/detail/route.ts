import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const utid = url.searchParams.get("utid");
  const homeworkId = url.searchParams.get("homeworkId");
  const studentId = url.searchParams.get("studentId");

  // Nếu có utid (submission ID cụ thể), lấy theo ID đó
  if (utid) {
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: Number(utid) },
      include: {
        questionAnswers: {
          include: {
            question: true,
          },
        },
        attachments: true,
        homework: {
          include: {
            attachments: true,
          },
        }
      },
    });

    if (!submission) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy bài làm." }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(submission), { status: 200 });
  }

  // Nếu có homeworkId và studentId, lấy submission có điểm cao nhất
  if (homeworkId && studentId) {
    const submission = await prisma.homeworkSubmission.findFirst({
      where: {
        homeworkId: Number(homeworkId),
        studentId: studentId,
        grade: { not: null } // Chỉ lấy submission đã được chấm điểm
      },
      include: {
        questionAnswers: {
          include: {
            question: true,
          },
        },
        attachments: true,
        homework: {
          include: {
            attachments: true,
          },
        }
      },
      orderBy: {
        grade: 'desc' // Sắp xếp theo điểm cao nhất
      }
    });

    if (!submission) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy bài làm nào đã được chấm điểm." }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(submission), { status: 200 });
  }

  return new Response(
    JSON.stringify({ error: "Thiếu thông tin bài làm. Cần utid hoặc (homeworkId + studentId)." }),
    { status: 400 }
  );
}