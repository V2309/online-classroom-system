// @/app/overview/page.tsx
// Đã gộp và tối ưu từ 2 file `overview` và `results`

import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import Table from '@/components/Table'; // Giả định bạn có component Table này
import dynamic from 'next/dynamic';

// Tải bất đồng bộ component biểu đồ để không làm chậm server
const StudentHomeworkChart = dynamic(() => import('@/components/StudentHomeworkChart'), { ssr: false });

/**
 * Lấy ảnh icon dựa trên loại file
 */
function getAttachmentImage(fileType: string): string {
  if (fileType.includes('pdf')) {
    return "/pdf_red.png";
  }
  // Thêm các trường hợp khác nếu cần
  // if (fileType.includes('word')) {
  //   return "/doc_blue.png"; 
  // }
  return "/doc_blue.png"; // Ảnh mặc định
}

export default async function OverviewPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'student') {
    return <div className="p-8 text-center text-red-500">Không có quyền truy cập</div>;
  }

  // === TỐI ƯU HÓA TRUY VẤN ===
  // Chạy MỘT truy vấn duy nhất để lấy tất cả dữ liệu cần thiết
  const student = await prisma.student.findUnique({
    where: { userId: user.id as string },
    include: {
      classes: { // Lấy tất cả các lớp học
        include: {
          supervisor: { // Lấy thông tin giáo viên
            select: { username: true } 
          },
          homeworks: { // Lấy tất cả bài tập của lớp
            orderBy: { createdAt: 'asc' },
            include: {
              attachments: { take: 1 }, // Chỉ lấy 1 attachment để lấy icon
              submissions: { // Lấy TẤT CẢ bài nộp của HỌC SINH NÀY
                where: { studentId: user.id as string },
              },
            },
          },
        },
      },
    },
  });

  if (!student) {
    return <div className="p-8 text-center text-red-500">Không tìm thấy thông tin học sinh</div>;
  }

  // === XỬ LÝ DỮ LIỆU ===

  const allHomeworks = student.classes.flatMap(classInfo => 
    classInfo.homeworks.map(hw => ({
      ...hw,
      className: classInfo.name,
      classCode: classInfo.class_code
    }))
  );

  // 1. Lọc Bài tập chưa nộp (Logic từ file `overview`)
  const pendingHomeworks = allHomeworks
    .filter(hw => {
      const hasSubmission = hw.submissions.length > 0;
      const isExpired = hw.endTime && new Date() > new Date(hw.endTime);
      return !hasSubmission && !isExpired; // Chưa nộp VÀ chưa hết hạn
    })
    .map(hw => {
      const attachmentType = hw.attachments?.[0]?.type || "";
      const attachmentImage = getAttachmentImage(attachmentType);
      
      return {
        id: hw.id,
        title: hw.title,
        className: hw.className,
        endTime: hw.endTime,
        classCode: hw.classCode,
        attachmentImage,
      };
    });

  // 2. Xử lý Thành tích học tập (Logic từ file `results`)
  const classResults = student.classes.map(classInfo => {
    
    // Lấy điểm cao nhất của mỗi bài tập
    const homeworksWithHighestGrade = classInfo.homeworks.map(hw => {
      if (hw.submissions.length === 0) {
        return {
          title: hw.title,
          grade: null,
          submittedAt: null,
        };
      }
      
      // Tìm bài nộp có điểm cao nhất
      const highestSubmission = hw.submissions.reduce((max, sub) => {
        if (sub.grade === null) return max;
        if (max.grade === null) return sub;
        return sub.grade > max.grade ? sub : max;
      });

      return {
        title: hw.title,
        grade: highestSubmission.grade,
        submittedAt: highestSubmission.submittedAt,
      };
    });

    // Chỉ lấy các bài đã có điểm để tính trung bình
    const gradedHomeworks = homeworksWithHighestGrade.filter(hw => hw.grade !== null);
    
    const averageGrade = gradedHomeworks.length > 0
      ? (gradedHomeworks.reduce((sum, hw) => sum + (hw.grade || 0), 0) / gradedHomeworks.length).toFixed(2)
      : 'Chưa có điểm';
      
    // Tính toán tỷ lệ hoàn thành (từ file `overview`)
    const totalHomeworks = classInfo.homeworks.length;
    const completedHomeworks = classInfo.homeworks.filter(hw => hw.submissions.length > 0).length;
    const completionRate = totalHomeworks > 0 ? Math.round((completedHomeworks / totalHomeworks) * 100) : 0;

    return {
      className: classInfo.name,
      teacherName: classInfo.supervisor?.username || 'Chưa có giáo viên',
      averageGrade,
      completionRate,
      totalHomeworks,
      completedHomeworks,
      // Dùng cho biểu đồ và bảng
      chartData: homeworksWithHighestGrade.filter(hw => hw.submittedAt), // Chỉ hiển thị bài đã nộp
      tableData: homeworksWithHighestGrade, // Hiển thị tất cả
    };
  });

  // === RENDER GIAO DIỆN ===
  return (
    <div className="h-full bg-gray-100 p-4 md:p-6 lg:p-8 w-full space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Tổng quan Học tập</h1>

      {/* === Section 1: Bài tập chưa nộp (từ overview.tsx) === */}
      <div className="rounded-lg p-4 md:p-6 bg-white shadow-sm">
        <h2 className="font-semibold text-lg md:text-xl mb-4 flex items-center gap-2">
          Bài tập chưa nộp <span className="text-base text-gray-500">• {pendingHomeworks.length}</span>
        </h2>
        <div className="overflow-x-auto">
          {/* Bảng cho Desktop */}
          <table className="min-w-full hidden md:table">
            <thead>
              <tr className="text-gray-500 text-sm">
                <th className="text-left px-4 py-3 font-medium">Tên bài tập</th>
                <th className="text-left px-4 py-3 font-medium">Lớp</th>
                <th className="text-left px-4 py-3 font-medium">Hạn chót</th>
              </tr>
            </thead>
            <tbody>
              {pendingHomeworks.length > 0 ? (
                pendingHomeworks.map((homework) => (
                  <tr key={homework.id} className="border-t hover:bg-blue-50 transition-colors duration-200 cursor-pointer">
                    <td className="flex items-center gap-3 px-4 py-4">
                      <Image src={homework.attachmentImage} alt="Homework" width={32} height={32} />
                      <div>
                        <div className="font-medium text-sm md:text-base">{homework.title}</div>
                        <div className="text-xs text-gray-500">Chưa làm</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">{homework.className}</td>
                    <td className="px-4 py-4 text-sm">
                      {homework.endTime
                        ? new Date(homework.endTime).toLocaleString('vi-VN')
                        : 'Không có'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t">
                  <td colSpan={3} className="px-4 py-4 text-center text-gray-500">
                    Tuyệt vời! Không có bài tập nào sắp hết hạn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Giao diện cho Mobile */}
          <div className="md:hidden">
            {pendingHomeworks.length > 0 ? (
              pendingHomeworks.map((homework) => (
                <div key={homework.id} className="bg-white rounded-lg shadow-sm p-4 mb-3 border border-gray-200 hover:bg-blue-50 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <Image src={homework.attachmentImage} alt="Homework" width={32} height={32} />
                    <div>
                      <div className="font-semibold">{homework.title}</div>
                      <div className="text-sm text-gray-500">Lớp: {homework.className}</div>
                      <div className="text-sm text-red-500 mt-1">
                        Hạn chót: {homework.endTime
                          ? new Date(homework.endTime).toLocaleString('vi-VN')
                          : 'Không có'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-6">
                Tuyệt vời! Không có bài tập nào sắp hết hạn.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === Section 2: Thành tích học tập (từ results.tsx) === */}
      <div className="rounded-lg p-4 md:p-6 bg-white shadow-sm">
         <h2 className="font-semibold text-lg md:text-xl mb-4 flex items-center gap-2">
           Thành tích học tập theo lớp
         </h2>
      </div>

      {/* Lặp qua từng lớp */}
      {classResults.map((cls, idx) => (
        <div key={idx} className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold mb-2 text-blue-600">Lớp: {cls.className}</h3>
          <p className="text-sm text-gray-600 mb-4">Giáo viên: {cls.teacherName}</p>

          {/* Thống kê của lớp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Điểm TB */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="text-sm font-medium text-blue-700">Điểm TB (cao nhất)</div>
              <span className={`text-3xl font-bold ${
                  cls.averageGrade === 'Chưa có điểm' ? 'text-gray-500'
                  : parseFloat(cls.averageGrade) >= 8 ? 'text-green-600'
                  : parseFloat(cls.averageGrade) >= 6.5 ? 'text-yellow-600'
                  : 'text-red-600'
              }`}>
                {cls.averageGrade}
              </span>
            </div>
            
            {/* Tỷ lệ hoàn thành */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="text-sm font-medium text-green-700">Tỷ lệ hoàn thành</div>
              <div className="flex items-center gap-2 mt-2">
                 <div className="w-full bg-gray-200 rounded-full h-2">
                   <div
                     className={`h-2 rounded-full ${
                       cls.completionRate >= 80 ? 'bg-green-500'
                       : cls.completionRate >= 60 ? 'bg-yellow-500'
                       : 'bg-red-500'
                     }`}
                     style={{ width: `${cls.completionRate}%` }}
                   ></div>
                 </div>
                 <span className="text-lg font-bold text-gray-600">{cls.completionRate}%</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">{cls.completedHomeworks}/{cls.totalHomeworks} bài tập</div>
            </div>
          </div>

          {/* Biểu đồ điểm các bài tập */}
          {cls.chartData.length > 0 ? (
            <div className="mb-8">
              <h4 className="text-md font-semibold mb-2 text-slate-700">Biểu đồ điểm số</h4>
              <StudentHomeworkChart homeworks={cls.chartData} totalHomeworks={cls.totalHomeworks} />
            </div>
          ) : (
            <div className="mb-8 text-gray-500">Chưa có bài tập đã nộp để hiển thị biểu đồ.</div>
          )}

          {/* Bảng điểm chi tiết - Chỉ hiển thị bài tập đã có điểm */}
          <h4 className="text-md font-semibold mb-2 text-slate-700">Bảng điểm chi tiết</h4>
          {cls.tableData.filter(item => item.grade !== null && item.grade !== undefined).length > 0 ? (
            <Table
              columns={[
                { header: 'Tên bài tập', accessor: 'title' },
                { header: 'Điểm cao nhất', accessor: 'grade' },
                { header: 'Ngày nộp', accessor: 'submittedAt' },
              ]}
              data={cls.tableData.filter(item => item.grade !== null && item.grade !== undefined)}
              renderRow={(item: any) => (
                <tr key={item.title} className="border-t hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium">{item.title}</td>
                  <td className={`px-4 py-2 font-semibold ${
                    item.grade >= 8 ? 'text-green-600'
                    : item.grade >= 6.5 ? 'text-yellow-600'
                    : 'text-red-600'
                  }`}>
                    {item.grade}
                  </td>
                  <td className="px-4 py-2">{item.submittedAt ? new Date(item.submittedAt).toLocaleString('vi-VN') : '-'}</td>
                </tr>
              )}
            />
          ) : (
            <div className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg">
              Chưa có bài tập nào được chấm điểm
            </div>
          )}
        </div>
      ))}
    </div>
  );
}