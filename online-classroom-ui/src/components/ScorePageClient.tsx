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
    <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col h-full">
      {/* Header chung chuẩn class */}
      <ClassPageHeader title={`Bảng điểm Chi tiết Lớp: ${classInfo.name}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-1.5 text-sm text-muted-foreground">
            <BookOpen size={16} />
            <span>{homeworkCount} bài tập</span>
          </div>

          {userRole === "teacher" && (
            <>
              <div className="flex items-center space-x-1.5 text-sm text-muted-foreground">
                <Users size={16} />
                <span>{studentCount} học sinh</span>
              </div>

              {chartData.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowChart(!showChart)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    showChart
                      ? "bg-accent text-primary border-border font-semibold"
                      : "bg-card text-foreground border-border hover:bg-accent"
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
        <div className="p-4 border-b border-border bg-background">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Biểu đồ Điểm trung bình Lớp
          </h3>
          <ScoreLineChart data={chartData} />
        </div>
      )}

      {/* Bảng điểm chi tiết */}
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full text-sm relative">
          <thead className="bg-muted sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 bg-muted px-4 py-3 text-left font-semibold text-foreground w-16 z-30">
                STT
              </th>
              <th className="left-16 bg-muted px-4 py-3 text-left font-semibold text-foreground min-w-[200px] z-30">
                Họ và tên
              </th>
              <th className="px-4 py-3 text-center font-semibold text-primary bg-accent/50 min-w-[120px]">
                Trung Bình
              </th>

              {homeworks.map((homework) => (
                <th
                  key={homework.id}
                  className="px-3 py-3 text-center font-semibold text-foreground min-w-[100px]"
                  title={homework.title}
                >
                  <div className="truncate max-w-[150px]">{homework.title}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    ({homework.points || "N/A"}đ)
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredStudentScores.length === 0 ? (
              <tr>
                <td colSpan={3 + homeworks.length} className="text-center py-10 text-muted-foreground">
                  Chưa có dữ liệu học sinh
                </td>
              </tr>
            ) : (
              filteredStudentScores.map((student, index) => {
                const avg = student.average;
                const scoreColor =
                  avg >= 8
                    ? "text-state-success font-bold"
                    : avg >= 5
                    ? "text-state-warning font-bold"
                    : "text-destructive font-bold";

                return (
                  <tr
                    key={student.id}
                    className="border-t border-border hover:bg-accent/30 transition-colors"
                  >
                    <td className="sticky left-0 bg-card hover:bg-accent/30 px-4 py-3 text-center text-muted-foreground z-10">
                      {index + 1}
                    </td>
                    <td className="left-16 bg-card hover:bg-accent/30 px-4 py-3 font-medium text-foreground z-10">
                      {student.username}
                    </td>
                    <td className="px-4 py-3 text-center font-bold bg-accent/20">
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
                          ? "text-muted-foreground/60"
                          : score >= 8
                          ? "text-state-success"
                          : score >= 5
                          ? "text-state-warning"
                          : "text-destructive";
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