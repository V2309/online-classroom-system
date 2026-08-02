'use client';
import TableSearch from "@/components/TableSearch";
import Image from "@/components/Image";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import FormModal from "@/components/FormModal";
// 1. Import component sidebar mới
import ApprovalSidebar from "./modals/ApprovalSidebar";
// 2. Import kiểu dữ liệu từ page.tsx
import { PendingRequest } from "@/app/(page)/class/[id]/member/page";

interface MemberListProps {
  data: StudentList[];
  count: number;
  capacity?: number;
  userRole: string;
  page: number;
  classId: string;
  pendingRequests: PendingRequest[]; // 3. Nhận prop mới
}
type StudentList = {
  id: string;
  username: string;
  schoolname: string;
  img: string | null;
  class_name: string;
  classes: { name: string }[];
};

const MemberList = ({
  data,
  count,
  capacity,
  userRole,
  page,
  classId,
  pendingRequests, // 4. Lấy prop mới
}: MemberListProps) => {
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
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];


  const renderRow = (item: StudentList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-gray-50"
    >
      <td className="flex items-center gap-4 p-4">
        <Image 
        path={item.img || "/avatar.png"}
        alt="User Avatar"
        w={40} // Đặt kích thước bạn muốn
        h={40} // Đặt kích thước bạn muốn
        className="rounded-full object-cover"
      />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.username}</h3>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.schoolname}</td>
      <td className="hidden md:table-cell">{item.class_name}</td>
      <td>
        <div className="flex items-center gap-2">
          {userRole === "teacher" && (
            <>
              <FormModal 
                table="studentFromClass" 
                type="delete" 
                id={item.id} 
                relatedData={{ classCode: classId }} 
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  // 5. THAY ĐỔI LAYOUT
  return (
    // Dùng flex để chia 2 cột
    <div className="flex flex-col md:flex-row h-full">
      
      {/* Cột 1: Danh sách thành viên (chiếm 2/3) */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex-1 md:flex-[2_2_0%] h-full flex flex-col">
        {/* Top */}
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold">
            Thành viên lớp học ({count}/{capacity})
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch />
            {/* ... (Các nút filter/sort) ... */}
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
    </div>
  );
};

export default MemberList;
