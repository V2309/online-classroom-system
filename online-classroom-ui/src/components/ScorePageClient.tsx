// components/ScorePageClient.tsx
"use client";

// Import các component tương tác
import ScoreLineChart from "@/components/ScoreLineChart"; // Đảm bảo đường dẫn đúng
import ExportButton from "@/components/ExportButton"; // Đảm bảo đường dẫn đúng
import { BookOpen, Users } from "lucide-react";

// Import kiểu dữ liệu từ file page
// (Đảm bảo bạn đã export chúng từ page.tsx)
import type {
  StudentScore,
  HomeworkData,
} from "@/app/(page)/class/[id]/scoretable/page";

interface ScorePageClientProps {
  classInfo: { id: number; name: string };
  chartData: any[];
  studentScores: StudentScore[];
  homeworks: HomeworkData[];
  studentCount: number;
  homeworkCount: number;
  currentUserId?: string;
  userRole?: string;
}

export default function ScorePageClient({
  classInfo,
  chartData,
  studentScores,
  homeworks,
  studentCount,
  homeworkCount,
  currentUserId,
  userRole,
}: ScorePageClientProps) {
  // Lọc dữ liệu dựa trên role
  const filteredStudentScores = userRole === 'student' 
    ? studentScores.filter(student => student.id === currentUserId)
    : studentScores;
  // Giao diện (JSX) được chuyển từ page.tsx sang đây
  return (
    <div className="bg-white min-h-screen flex flex-col p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-1">
        
        {/* Hộp Biểu Đồ - Chỉ hiển thị cho giáo viên */}
        {userRole === 'teacher' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-slate-700">
                Biểu đồ Điểm trung bình Lớp
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Hiển thị điểm trung bình của cả lớp qua các bài tập.
              </p>
            </div>
            <div className="p-5">
              {chartData.length > 0 ? (
                <ScoreLineChart data={chartData} />
              ) : (
                <p className="text-center text-slate-500 py-10">
                  Chưa có đủ dữ liệu điểm để vẽ biểu đồ.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bảng điểm */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 flex flex-col flex-1 min-h-[600px]">
          <div className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-slate-700">
                Bảng điểm Chi tiết Lớp: {classInfo.name}
              </h2>
            </div>
            {/* TỐI ƯU RESPONSIVE:
                Thêm flex-col, items-start để xếp chồng trên di động
                và sm:flex-row, sm:items-center để về hàng ngang trên desktop
            */}
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-4"> {/* Nhóm 2 thống kê lại */}
            
                 
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <BookOpen size={16} />
                  <span>{homeworkCount} bài tập</span>
                </div>
              </div>
           
               
              {userRole === 'teacher' && (

                <>
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <Users size={16} />
                  <span>{studentCount} học sinh</span>
                </div>
        

              <ExportButton
                studentScores={studentScores}
                homeworks={homeworks}
              />
                </>
              )}
            </div>
          </div>

          {/* Container cho bảng có thể cuộn */}
          {/* Cách làm dùng overflow-x-auto và sticky columns là RẤT TỐT cho responsive bảng */}
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-sm relative">
              <thead className="bg-gray-50 sticky top-0 z-20">
                <tr>
                  <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left font-semibold text-slate-600 w-16 z-30">
                    STT
                  </th>
                  <th className=" left-16 bg-gray-50 px-4 py-3 text-left font-semibold text-slate-600 min-w-[200px] z-30">
                    Họ và tên
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-blue-600 bg-blue-50 min-w-[120px]">
                    Trung Bình
                  </th>

                  {homeworks.map((homework) => (
                    <th
                      key={homework.id}
                      className="px-3 py-3 text-center font-semibold text-slate-600 min-w-[100px]"
                      title={homework.title}
                    >
                      <div className="truncate">{homework.title}</div>
                      <div className="text-xs text-slate-400 font-normal">
                        ({homework.points || "N/A"}đ)
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudentScores.map((student, index) => {
                  const avg = student.average;
                  const scoreColor =
                    avg >= 8
                      ? "text-green-600"
                      : avg >= 5
                      ? "text-yellow-600"
                      : "text-red-600";

                  return (
                    <tr
                      key={student.id}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="sticky left-0 bg-white hover:bg-gray-50 px-4 py-3 text-center text-slate-500 z-10">
                        {index + 1}
                      </td>
                      <td className=" left-16 bg-white hover:bg-gray-50 px-4 py-3 font-medium text-slate-800 z-10">
                        {student.username}
                      </td>
                      <td className="px-4 py-3 text-center font-bold bg-blue-50">
                        <span className={scoreColor}>{avg.toFixed(1)}</span>
                      </td>
                      {homeworks.map((homework) => {
                        const score =
                          student.homeworkScores[homework.id.toString()]; // Convert to string for lookup
                        const cellColor =
                          score === null
                            ? "text-slate-400"
                            : score >= 8
                            ? "text-green-600"
                            : score >= 5
                            ? "text-yellow-600"
                            : "text-red-600";
                        return (
                          <td key={homework.id} className="px-3 py-3 text-center">
                            <span className={`font-semibold ${cellColor}`}>
                              {score !== null ? score : "-"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}