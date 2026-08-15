"use client";

import ScoreLineChart from "@/components/ScoreLineChart";
import ExportButton from "@/components/ExportButton";
import { BookOpen, Users, BarChart3 } from "lucide-react";
import ClassPageHeader from "@/components/ClassPageHeader";
import { useState } from "react";

// Import kiểu dữ liệu từ file page
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
  const [showChart, setShowChart] = useState(false);

  // Lọc dữ liệu dựa trên role
  const filteredStudentScores = userRole === 'student' 
    ? studentScores.filter(student => student.id === currentUserId)
    : studentScores;

  return (
    <div className="bg-white rounded-lg shadow-md flex flex-col h-full">
      {/* Header chung chuẩn class */}
      <ClassPageHeader title={`Bảng điểm Chi tiết Lớp: ${classInfo.name}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-1.5 text-sm text-slate-500">
            <BookOpen size={16} />
            <span>{homeworkCount} bài tập</span>
          </div>

          {userRole === "teacher" && (
            <>
              <div className="flex items-center space-x-1.5 text-sm text-slate-500">
                <Users size={16} />
                <span>{studentCount} học sinh</span>
              </div>

              {chartData.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowChart(!showChart)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    showChart
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <BarChart3 size={14} />
                  <span>{showChart ? "Ẩn biểu đồ" : "Xem biểu đồ"}</span>
                </button>
              )}

              <ExportButton
                studentScores={studentScores}
                homeworks={homeworks}
              />
            </>
          )}
        </div>
      </ClassPageHeader>

      {/* Biểu đồ nếu bật (cho giáo viên) */}
      {userRole === 'teacher' && showChart && chartData.length > 0 && (
        <div className="p-4 border-b border-gray-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">
            Biểu đồ Điểm trung bình Lớp
          </h3>
          <ScoreLineChart data={chartData} />
        </div>
      )}

      {/* Bảng điểm chi tiết */}
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full text-sm relative">
          <thead className="bg-gray-50 sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left font-semibold text-slate-600 w-16 z-30">
                STT
              </th>
              <th className="left-16 bg-gray-50 px-4 py-3 text-left font-semibold text-slate-600 min-w-[200px] z-30">
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
                  <div className="truncate max-w-[150px]">{homework.title}</div>
                  <div className="text-xs text-slate-400 font-normal">
                    ({homework.points || "N/A"}đ)
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredStudentScores.length === 0 ? (
              <tr>
                <td colSpan={3 + homeworks.length} className="text-center py-10 text-slate-400">
                  Chưa có dữ liệu học sinh
                </td>
              </tr>
            ) : (
              filteredStudentScores.map((student, index) => {
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
                    className="border-t border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="sticky left-0 bg-white hover:bg-gray-50 px-4 py-3 text-center text-slate-500 z-10">
                      {index + 1}
                    </td>
                    <td className="left-16 bg-white hover:bg-gray-50 px-4 py-3 font-medium text-slate-800 z-10">
                      {student.username}
                    </td>
                    <td className="px-4 py-3 text-center font-bold bg-blue-50">
                      <span className={scoreColor}>
                        {Object.values(student.homeworkScores).some((s) => s !== null)
                          ? avg.toFixed(1)
                          : "-"}
                      </span>
                    </td>
                    {homeworks.map((homework) => {
                      const score =
                        student.homeworkScores[homework.id.toString()];
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}