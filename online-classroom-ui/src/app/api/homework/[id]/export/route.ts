import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const homeworkId = parseInt(params.id, 10);
  if (isNaN(homeworkId)) {
    return NextResponse.json({ error: "Invalid homework id" }, { status: 400 });
  }

  // Lấy submission cuối cùng của mỗi học sinh
  const submissions = await prisma.homeworkSubmission.findMany({
    where: { 
      homeworkId,
      attemptNumber: { gt: 0 }, // Chỉ lấy submission thật sự của học sinh
    },
    include: {
      student: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  // Lọc để chỉ lấy submission cuối cùng của mỗi học sinh
  const latestSubmissions = submissions.reduce((acc, submission) => {
    const studentId = submission.studentId;
    if (!acc[studentId] || new Date(submission.submittedAt) > new Date(acc[studentId].submittedAt)) {
      acc[studentId] = submission;
    }
    return acc;
  }, {} as Record<string, typeof submissions[0]>);

  const finalSubmissions = Object.values(latestSubmissions).sort((a, b) => 
    new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );

  // Tạo workbook Excel
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Danh sách nộp bài");

  // Header
  sheet.addRow([
    "STT", "Họ và tên", "Vai trò", "Trường", "Lớp", "Điểm", "Thời gian làm bài (phút)", "Thời gian nộp bài"
  ]);

  // Dữ liệu - sử dụng finalSubmissions thay vì submissions
  finalSubmissions.forEach((sub, idx) => {
    const s = sub.student;
    sheet.addRow([
      idx + 1,
      s?.username || "",
      "Học sinh",
      s?.schoolname || "",
      s?.class_name || "",
      sub.grade ?? "",
      sub.timeSpent ? Math.round(sub.timeSpent / 60) : "",
      sub.submittedAt ? new Date(sub.submittedAt).toLocaleString("vi-VN") : "",
    ]);
  });

  // Xuất file
  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=homework_${homeworkId}_export.xlsx`,
    },
  });
} 