"use client";

import { useState, useMemo } from "react";
import ScoreLineChart from "@/components/ScoreLineChart";
import ExportButton from "@/components/ExportButton";
import {
  BookOpen,
  Users,
  BarChart3,
  Search,
  Award,
  TrendingUp,
  GraduationCap,
  Sparkles,
  Trophy,
  Filter,
} from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [scoreFilter, setScoreFilter] = useState<"all" | "excellent" | "good" | "average" | "weak">("all");

  // Lọc dữ liệu dựa trên role
  const roleFilteredScores = useMemo(() => {
    return userRole === "student"
      ? studentScores.filter((student) => student.id === currentUserId)
      : studentScores;
  }, [userRole, studentScores, currentUserId]);

  // Sắp xếp học sinh theo điểm trung bình giảm dần để xếp hạng
  const rankedStudentScores = useMemo(() => {
    return [...roleFilteredScores].sort((a, b) => (b.average || 0) - (a.average || 0));
  }, [roleFilteredScores]);

  // Lọc theo từ khóa tìm kiếm & phân loại điểm
  const filteredScores = useMemo(() => {
    return rankedStudentScores.filter((student) => {
      const matchSearch =
        student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.class_name && student.class_name.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      const avg = student.average || 0;
      if (scoreFilter === "excellent") return avg >= 8.0;
      if (scoreFilter === "good") return avg >= 6.5 && avg < 8.0;
      if (scoreFilter === "average") return avg >= 5.0 && avg < 6.5;
      if (scoreFilter === "weak") return avg < 5.0;

      return true;
    });
  }, [rankedStudentScores, searchTerm, scoreFilter]);

  // Thống kê nhanh toàn lớp
  const stats = useMemo(() => {
    if (studentScores.length === 0) return { classAverage: 0, passRate: 0, highestScore: 0, lowestScore: 0 };
    const validAverages = studentScores.map((s) => s.average).filter((avg) => avg > 0);
    const sum = validAverages.reduce((acc, curr) => acc + curr, 0);
    const classAverage = validAverages.length > 0 ? (sum / validAverages.length) : 0;
    const passedCount = studentScores.filter((s) => (s.average || 0) >= 5.0).length;
    const passRate = studentScores.length > 0 ? Math.round((passedCount / studentScores.length) * 100) : 0;
    const highestScore = Math.max(...studentScores.map((s) => s.average || 0), 0);

    return {
      classAverage: Number(classAverage.toFixed(1)),
      passRate,
      highestScore: Number(highestScore.toFixed(1)),
    };
  }, [studentScores]);

  const getScoreBadge = (score: number | null | undefined) => {
    if (score === null || score === undefined || isNaN(score)) {
      return <span className="text-muted-foreground/60 font-medium">-</span>;
    }
    if (score >= 8.0) {
      return (
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {score.toFixed(1)}
        </span>
      );
    }
    if (score >= 6.5) {
      return (
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          {score.toFixed(1)}
        </span>
      );
    }
    if (score >= 5.0) {
      return (
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          {score.toFixed(1)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        {score.toFixed(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER & ACTIONS ── */}
      <div className="bg-white rounded-3xl border border-border shadow-sm p-6 sm:p-7 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
              Bảng điểm lớp: {classInfo.name}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-secondary">
            Theo dõi điểm số, xếp hạng và kết quả học tập chi tiết của từng bài tập
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-auto">
          {userRole === "teacher" && (
            <>
              {chartData.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowChart(!showChart)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-2xl border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                    showChart
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-foreground border-border hover:bg-muted"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
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
      </div>

      {/* ── THỐNG KÊ NHANH (CHO GIÁO VIÊN HOẶC TOÀN LỚP) ── */}
      {userRole === "teacher" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-border shadow-sm flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-accent text-primary flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Sĩ số lớp</p>
              <p className="text-xl font-heading font-bold text-foreground">
                {studentCount} <span className="text-xs font-normal text-muted-foreground">học sinh</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-border shadow-sm flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-accent text-primary flex items-center justify-center flex-shrink-0 shadow-2xs">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Tổng bài tập</p>
              <p className="text-xl font-heading font-bold text-foreground">
                {homeworkCount} <span className="text-xs font-normal text-muted-foreground">bài</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-border shadow-sm flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Điểm TB cả lớp</p>
              <p className="text-xl font-heading font-bold text-emerald-700">
                {stats.classAverage > 0 ? stats.classAverage : "-"}
                <span className="text-xs font-normal text-muted-foreground">/10</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-border shadow-sm flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Điểm cao nhất</p>
              <p className="text-xl font-heading font-bold text-amber-700">
                {stats.highestScore > 0 ? stats.highestScore : "-"}
                <span className="text-xs font-normal text-muted-foreground">/10</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── BIỂU ĐỒ NẾU BẬT ── */}
      {userRole === "teacher" && showChart && chartData.length > 0 && (
        <div className="bg-white rounded-3xl border border-border shadow-sm p-6 sm:p-7 space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span>Biểu đồ phổ điểm trung bình của lớp</span>
            </h3>
            <span className="text-xs text-muted-foreground font-medium">Đơn vị: Thang điểm 10</span>
          </div>
          <ScoreLineChart data={chartData} />
        </div>
      )}

      {/* ── BẢNG ĐIỂM CHI TIẾT CARD ── */}
      <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar: Tìm kiếm & Bộ lọc */}
        <div className="p-4 sm:p-6 border-b border-border/70 flex flex-col sm:flex-row items-center justify-between gap-3.5">
          {/* Ô tìm kiếm */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên học sinh..."
              className="w-full bg-card text-foreground border border-border rounded-2xl px-4 py-2.5 pl-9 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none shadow-2xs placeholder:text-muted-foreground"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mr-1 flex-shrink-0">
              <Filter className="w-3 h-3" /> Lọc:
            </span>
            {[
              { key: "all", label: "Tất cả" },
              { key: "excellent", label: "Giỏi (≥8)" },
              { key: "good", label: "Khá (6.5-7.9)" },
              { key: "average", label: "TB (5-6.4)" },
              { key: "weak", label: "Dưới 5" },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setScoreFilter(f.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  scoreFilter === f.key
                    ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                    : "bg-muted hover:bg-muted/80 text-secondary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Khung Table cuộn ngang/dọc */}
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin">
          <table className="w-full text-xs sm:text-sm border-collapse text-left">
            <thead className="bg-muted/80 sticky top-0 z-20 backdrop-blur-xs border-b border-border">
              <tr>
                <th className="sticky left-0 bg-muted/95 px-4 py-3.5 text-center font-bold text-foreground w-14 z-30 border-r border-border/40">
                  Hạng
                </th>
                <th className="sticky left-14 bg-muted/95 px-4 py-3.5 text-left font-bold text-foreground min-w-[200px] z-30 border-r border-border/40 shadow-xs">
                  Họ và tên học sinh
                </th>
                <th className="px-4 py-3.5 text-center font-bold text-primary bg-accent/60 min-w-[130px] border-r border-border/40">
                  Trung Bình
                </th>

                {homeworks.map((homework) => (
                  <th
                    key={homework.id}
                    className="px-3.5 py-3.5 text-center font-semibold text-foreground min-w-[110px] border-r border-border/30 last:border-r-0"
                    title={homework.title}
                  >
                    <div className="truncate max-w-[140px] font-bold">{homework.title}</div>
                    <div className="text-[11px] text-muted-foreground font-normal mt-0.5">
                      ({homework.points || 10}đ)
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {filteredScores.length === 0 ? (
                <tr>
                  <td
                    colSpan={3 + homeworks.length}
                    className="text-center py-16 text-muted-foreground text-xs sm:text-sm"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <GraduationCap className="w-8 h-8 text-muted-foreground/40" />
                      <p className="font-semibold text-foreground">Không tìm thấy dữ liệu học sinh</p>
                      <p className="text-xs text-muted-foreground">Thử tìm kiếm với từ khóa khác hoặc bỏ bộ lọc.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredScores.map((student, index) => {
                  const avg = student.average;
                  const isTop1 = index === 0 && avg > 0;
                  const isTop2 = index === 1 && avg > 0;
                  const isTop3 = index === 2 && avg > 0;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      {/* Cột thứ hạng */}
                      <td className="sticky left-0 bg-white group-hover:bg-muted/60 px-3 py-3.5 text-center font-bold z-10 border-r border-border/40 transition-colors">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs shadow-2xs font-extrabold">
                            🥇
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs shadow-2xs font-extrabold">
                            🥈
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-800 text-xs shadow-2xs font-extrabold">
                            🥉
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-semibold">{index + 1}</span>
                        )}
                      </td>

                      {/* Cột họ tên */}
                      <td className="sticky left-14 bg-white group-hover:bg-muted/60 px-4 py-3.5 font-bold text-foreground z-10 border-r border-border/40 shadow-xs transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-accent text-primary font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {student.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground">{student.username}</span>
                            {student.class_name && (
                              <span className="text-[11px] text-muted-foreground block font-normal">
                                Lớp {student.class_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột điểm trung bình */}
                      <td className="px-4 py-3.5 text-center font-bold bg-accent/20 border-r border-border/40">
                        {getScoreBadge(avg)}
                      </td>

                      {/* Các cột điểm bài tập */}
                      {homeworks.map((homework) => {
                        const score = student.homeworkScores[homework.id.toString()];
                        const scoreNum = score !== null && score !== undefined ? Number(score) : null;

                        return (
                          <td
                            key={homework.id}
                            className="px-3.5 py-3.5 text-center border-r border-border/30 last:border-r-0"
                          >
                            {scoreNum !== null ? (
                              <span
                                className={`font-bold ${
                                  scoreNum >= 8.0
                                    ? "text-emerald-700"
                                    : scoreNum >= 5.0
                                    ? "text-amber-700"
                                    : "text-rose-700"
                                }`}
                              >
                                {scoreNum}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40 font-medium">-</span>
                            )}
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

        {/* Footer tổng kết bên dưới bảng */}
        <div className="p-4 border-t border-border/70 bg-muted/20 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Giỏi (≥ 8.0)
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Khá (6.5 - 7.9)
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> TB (5.0 - 6.4)
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Yếu (&lt; 5.0)
            </span>
          </div>

          <div className="font-semibold text-secondary">
            Hiển thị <span className="font-bold text-foreground">{filteredScores.length}</span> / {rankedStudentScores.length} học sinh
          </div>
        </div>
      </div>
    </div>
  );
}