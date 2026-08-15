'use client';

import { useState } from "react";
import TableSearch from "@/components/TableSearch";
import Image from "@/components/Image";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import ApprovalSidebar from "./modals/ApprovalSidebar";
import { PendingMemberRequest, StudentMember } from "@/types/class";
import { classService } from "@/services/class.service";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

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

  const columns = [
    {
      header: "Họ và tên ",
      accessor: "username",
    },
    {
      header: "Trường",
      accessor: "school",
      className: "hidden md:table-cell",
    },
    {
      header: "Lớp",
      accessor: "class",
      className: "hidden lg:table-cell",
    },
    ...(userRole === "teacher"
      ? [
          {
            header: "Thao tác",
            accessor: "action",
          },
        ]
      : []),
  ];

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

  const renderRow = (item: StudentMember) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-gray-50"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          path={item.img || "/avatar.png"}
          alt="User Avatar"
          w={40}
          h={40}
          className="rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.username}</h3>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.schoolname}</td>
      <td className="hidden md:table-cell">{item.class_name}</td>
      {userRole === "teacher" && (
        <td>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedStudent(item)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              title="Xóa khỏi lớp"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa</span>
            </button>
          </div>
        </td>
      )}
    </tr>
  );

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Cột 1: Danh sách thành viên (chiếm 2/3) */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex-1 md:flex-[2_2_0%] h-full flex flex-col">
        {/* Top */}
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold">
            Thành viên lớp học ({count}{capacity ? `/${capacity}` : ""})
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch />
          </div>
        </div>
        {/* List */}
        <div className="flex-1 mt-4">
          <Table columns={columns} renderRow={renderRow} data={data} />
        </div>
        {/* Pagination */}
        <div className="mt-4">
          <Pagination page={page} count={count} />
        </div>
      </div>

      {/* Cột 2: Cột phê duyệt (chiếm 1/3) */}
      {userRole === 'teacher' && (
        <div className="md:flex-[1_1_0%]">
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
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Xác nhận loại bỏ học sinh
              </h3>
              <button
                onClick={() => !loading && setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-center mb-3">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-gray-700 text-center font-medium">
                Bạn có chắc chắn muốn loại bỏ học sinh <span className="font-bold text-gray-900">{selectedStudent.username}</span> khỏi lớp học này?
              </p>
              <p className="text-sm text-gray-500 text-center mt-2">
                Học sinh sẽ không thể truy cập các tài liệu, bài tập và thảo luận của lớp học này nữa.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRemoveStudent}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
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
