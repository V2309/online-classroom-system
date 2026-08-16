"use client";

import { useState } from "react";
import TableSearch from "@/components/TableSearch";
import Image from "@/components/Image";
import Pagination from "@/components/Pagination";
import ApprovalSidebar from "./modals/ApprovalSidebar";
import { PendingMemberRequest, StudentMember } from "@/types/class";
import { classService } from "@/services/class.service";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Trash2, GraduationCap, Users, UserCheck, AlertTriangle } from "lucide-react";

interface MemberListProps {
  data: StudentMember[];
  count: number;
  capacity?: number;
  userRole: string;
  page: number;
  classId: string;
  pendingRequests: PendingMemberRequest[];
}

const MemberList = ({
  data,
  count,
  capacity,
  userRole,
  page,
  classId,
  pendingRequests,
}: MemberListProps) => {
  const router = useRouter();
  const [selectedStudent, setSelectedStudent] = useState<StudentMember | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRemoveStudent = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      await classService.removeStudentFromClass(classId, selectedStudent.id);
      toast.success("Học sinh đã được loại bỏ khỏi lớp học thành công!");
      setSelectedStudent(null);
      router.refresh();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Có lỗi xảy ra khi xóa học sinh khỏi lớp."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-background text-foreground flex flex-col lg:flex-row gap-5 p-4 sm:p-6 overflow-hidden min-h-[calc(100vh-65px)]">
      {/* ── CỘT 1: DANH SÁCH THÀNH VIÊN CARD ── */}
      <div className="bg-white rounded-3xl border border-border shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Top Header & Search */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent text-primary flex items-center justify-center shadow-2xs flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-heading font-bold text-foreground">
                  Thành viên lớp học
                </h1>
                <span className="text-xs font-bold text-primary bg-accent px-2.5 py-0.5 rounded-full">
                  {count}{capacity ? `/${capacity}` : ""}
                </span>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                Danh sách học sinh đang tham gia học tập trong lớp
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <TableSearch placeholder="Tìm theo tên học sinh..." />
          </div>
        </div>

        {/* Table Area (Scroll nội bộ) */}
        <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 scrollbar-thin px-4 sm:px-6">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white/95 backdrop-blur-xs z-10 border-b border-border/80">
              <tr className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 bg-white/95">Học sinh</th>
                <th className="py-3.5 px-4 bg-white/95">Vai trò</th>
                <th className="py-3.5 px-4 bg-white/95 hidden md:table-cell">Trường</th>
                <th className="py-3.5 px-4 bg-white/95 hidden lg:table-cell">Lớp</th>
                <th className="py-3.5 px-4 bg-white/95">Trạng thái</th>
                {userRole === "teacher" && (
                  <th className="py-3.5 px-4 bg-white/95 text-right">Thao tác</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data.map((item, idx) => (
                <tr
                  key={item.id}
                  className="hover:bg-muted/40 transition-colors group text-sm"
                >
                  {/* MEMBER INFO */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-border shadow-2xs">
                        <Image
                          path={item.img || "/avatar.png"}
                          alt={item.username}
                          w={80}
                          h={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-foreground text-sm sm:text-base leading-tight truncate">
                          {item.username}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {item.email || `${item.username.toLowerCase().replace(/\s+/g, "")}@student.docus.edu`}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* ROLE */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-secondary select-none">
                      <GraduationCap className="w-3.5 h-3.5 text-primary" />
                      <span>Học viên</span>
                    </span>
                  </td>

                  {/* TRƯỜNG */}
                  <td className="py-3.5 px-4 hidden md:table-cell text-secondary text-xs sm:text-sm font-medium">
                    {item.schoolname || "—"}
                  </td>

                  {/* LỚP */}
                  <td className="py-3.5 px-4 hidden lg:table-cell text-secondary text-xs sm:text-sm font-medium">
                    {item.class_name ? `Lớp ${item.class_name}` : "—"}
                  </td>

                  {/* STATUS */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Đang học</span>
                    </span>
                  </td>

                  {/* ACTION (TEACHER) */}
                  {userRole === "teacher" && (
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(item)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all inline-flex items-center justify-center cursor-pointer active:scale-95"
                        title="Xóa khỏi lớp học"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-muted-foreground bg-white">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-muted-foreground/40" />
                      <p className="font-semibold text-foreground">Chưa có thành viên nào trong danh sách</p>
                      <p className="text-xs text-muted-foreground">Chia sẻ mã lớp học để học sinh tham gia.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination ghim ở đáy card */}
        <div className="p-4 border-t border-border flex-shrink-0 mt-auto bg-white">
          <Pagination page={page} count={count} label="thành viên" />
        </div>
      </div>

      {/* ── CỘT 2: CỘT DUYỆT THÀNH VIÊN (CHO GIÁO VIÊN) ── */}
      {userRole === "teacher" && (
        <div className="w-full lg:w-88 flex-shrink-0 flex flex-col">
          <ApprovalSidebar requests={pendingRequests} classCode={classId} />
        </div>
      )}

      {/* ── MODAL XÁC NHẬN XÓA HỌC SINH ── */}
      {selectedStudent && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) setSelectedStudent(null);
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-xl border border-border p-6 sm:p-7 max-w-md w-full mx-4 text-foreground animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span>Xác nhận loại bỏ học sinh</span>
              </h3>
              <button
                onClick={() => !loading && setSelectedStudent(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 space-y-3">
              <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-destructive font-bold flex-shrink-0 shadow-2xs">
                  {selectedStudent.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">{selectedStudent.username}</p>
                  <p className="text-xs text-muted-foreground">{selectedStudent.schoolname || "Học sinh"}</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                Bạn có chắc chắn muốn xóa học sinh này khỏi lớp? Học sinh sẽ không thể tiếp tục làm bài tập hoặc truy cập tài liệu lớp học.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                disabled={loading}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-foreground bg-muted hover:bg-muted/80 rounded-2xl transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleRemoveStudent}
                disabled={loading}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-2xl transition-all disabled:opacity-50 shadow-xs cursor-pointer active:scale-95"
              >
                {loading ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberList;
