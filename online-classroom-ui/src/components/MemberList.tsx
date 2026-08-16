'use client';

import { useState } from "react";
import TableSearch from "@/components/TableSearch";
import Image from "@/components/Image";
import Pagination from "@/components/Pagination";
import ApprovalSidebar from "./modals/ApprovalSidebar";
import { PendingMemberRequest, StudentMember } from "@/types/class";
import { classService } from "@/services/class.service";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Trash2, GraduationCap } from "lucide-react";
import ClassPageHeader from "@/components/ClassPageHeader";

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
    <div className="h-full w-full bg-white text-foreground sm:pt-0 flex flex-col md:flex-row overflow-hidden">
      {/* CỘT 1: DANH SÁCH THÀNH VIÊN (CHIẾM FULL CHIỀU CAO - BG WHITE) */}
      <div className="bg-white shadow-sm flex-1 md:flex-[2.5_2.5_0%] h-full flex flex-col text-foreground overflow-hidden">
        {/* Top Header Nằm Sát Đầu Card */}
        <div className="flex-shrink-0">
          <ClassPageHeader
            title="Thành viên lớp học"
            count={`${count}${capacity ? `/${capacity}` : ""}`}
            className="bg-white border-b border-border px-5 sm:px-6 py-3.5"
          >
            <TableSearch />
          </ClassPageHeader>
        </div>

        {/* Table Area (Chiếm toàn bộ chiều cao và scroll bên trong) */}
        <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 scrollbar-thin px-4 sm:px-6 bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 bg-white">Member Info</th>
                <th className="py-3 px-4 bg-white">Role</th>
                <th className="py-3 px-4 bg-white hidden md:table-cell">Trường</th>
                <th className="py-3 px-4 bg-white hidden lg:table-cell">Lớp</th>
                <th className="py-3 px-4 bg-white">Status</th>
                {userRole === "teacher" && (
                  <th className="py-3 px-4 bg-white text-right">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {data.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-muted/40 transition-colors group text-sm"
                >
                  {/* MEMBER INFO */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-border">
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
                          {item.email || `${item.username.toLowerCase().replace(/\s+/g, '')}@example.com`}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* ROLE */}
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-secondary select-none">
                      <GraduationCap className="w-3.5 h-3.5 text-secondary" />
                      <span>Student</span>
                    </span>
                  </td>

                  {/* TRƯỜNG */}
                  <td className="py-3 px-4 hidden md:table-cell text-secondary text-sm">
                    {item.schoolname || "—"}
                  </td>

                  {/* LỚP */}
                  <td className="py-3 px-4 hidden lg:table-cell text-secondary text-sm">
                    {item.class_name || "—"}
                  </td>

                  {/* STATUS */}
                  <td className="py-3 px-4">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary select-none">
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                      <span>Active</span>
                    </div>
                  </td>

                  {/* ACTION (TEACHER) */}
                  {userRole === "teacher" && (
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(item)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Xóa khỏi lớp"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground bg-white">
                    Chưa có thành viên nào trong danh sách.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination ghim ở đáy card */}
        <div className="p-3 sm:p-4 border-t border-border flex-shrink-0 mt-auto bg-white">
          <Pagination page={page} count={count} label="thành viên" />
        </div>
      </div>

      {/* CỘT 2: CỘT PHÊ DUYỆT (CHO GIÁO VIÊN) */}
      {userRole === 'teacher' && (
        <div className="w-full md:w-80 lg:w-88 flex-shrink-0 h-full flex flex-col bg-white">
          <ApprovalSidebar
            requests={pendingRequests}
            classCode={classId}
          />
        </div>
      )}

      {/* Modal xác nhận xóa học sinh */}
      {selectedStudent && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) setSelectedStudent(null);
          }}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-border p-6 max-w-md w-full mx-4 text-foreground animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">
                Xác nhận loại bỏ học sinh
              </h3>
              <button
                onClick={() => !loading && setSelectedStudent(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-center mb-3">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-destructive/10">
                  <Trash2 className="w-6 h-6 text-destructive" />
                </div>
              </div>
              <p className="text-foreground text-center font-medium">
                Bạn có chắc chắn muốn loại bỏ học sinh <span className="font-bold text-primary">{selectedStudent.username}</span> khỏi lớp học này?
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
                Học sinh sẽ không thể truy cập các tài liệu, bài tập và thảo luận của lớp học này nữa.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-accent rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRemoveStudent}
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-xl transition-colors disabled:opacity-50 shadow-xs"
              >
                {loading ? "Đang xử lý..." : "Loại bỏ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberList;
