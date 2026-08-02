'use client';
import TableSearch from "@/components/TableSearch";
import Image from "@/components/Image";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import FormModal from "@/components/FormModal";
import { UserForList } from "@/app/(admin)/dashboard/user/page"; // Import kiểu từ file page.tsx
import { UserRole } from "@prisma/client"; // Import enum

// 1. Import action và hook
import { toggleUserBlock } from "@/lib/actions/user.action";
import { useTransition } from "react";

interface UserListProps {
  data: UserForList[];
  count: number;
  page: number;
}

const UserList = ({
  data,
  count,
  page,
}: UserListProps) => {
  // 2. Khởi tạo hook transition
  const [isPending, startTransition] = useTransition();

  // 3. Hàm xử lý khi bấm nút khóa/mở
  const handleToggleBlock = (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? "MỞ KHÓA" : "KHÓA";
    if (!confirm(`Bạn có chắc chắn muốn ${action} tài khoản này không?`)) return;

    startTransition(async () => {
      // Gọi server action
      await toggleUserBlock(userId, currentStatus);
    });
  };

  // Cập nhật các cột cho bảng User
  const columns = [
    {
      header: "Họ và tên",
      accessor: "username",
    },
    {
      header: "Email",
      accessor: "email",
      className: "hidden md:table-cell",
    },
    {
      header: "Vai trò", // Đổi tên cột
      accessor: "role",
      className: "hidden sm:table-cell",
    },
    {
      header: "Trường",
      accessor: "school",
      className: "hidden lg:table-cell",
    },
    {
      header: "Ngày tham gia",
      accessor: "date",
      className: "hidden lg:table-cell",
    },
    {
      header: "Actions",
      accessor: "action",
    },
  ];

  const renderRow = (item: UserForList) => (
    <tr
      key={item.id}
      className={`border-b border-gray-200 text-sm hover:bg-gray-50 ${
        item.isBanned ? "bg-red-50 hover:bg-red-100" : "even:bg-slate-50" // 4. Đổi màu nền nếu bị khóa
      }`}
    >
      {/* Cột Họ và tên */}
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
      {/* Cột Email */}
      <td className="hidden md:table-cell p-4">{item.email}</td>
      
      {/* 5. Cột Vai trò & Trạng thái (Cập nhật) */}
      <td className="hidden sm:table-cell p-4">
         <div className="flex flex-col gap-1">
            <span className={`w-fit px-2 py-1 rounded-full text-xs font-medium ${
                item.role === UserRole.teacher 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
               {item.role === UserRole.teacher ? 'Giáo viên' : 'Học sinh'}
            </span>
            {item.isBanned && (
                <span className="w-fit px-2 py-0.5 rounded text-[10px] bg-red-500 text-white font-bold">
                    ĐÃ KHÓA
                </span>
            )}
         </div>
      </td>

      {/* Cột Trường */}
      <td className="hidden lg:table-cell p-4">{item.schoolname}</td>
      {/* Cột Ngày tham gia */}
      <td className="hidden lg:table-cell p-4">
        {new Date(item.createdAt).toLocaleDateString("vi-VN")}
      </td>

      {/* 6. Cột Actions (Cập nhật) */}
      <td className="p-4">
        <div className="flex items-center gap-2">
          
          {/* Nút KHÓA / MỞ KHÓA */}
          <button 
            onClick={() => handleToggleBlock(item.id, item.isBanned)}
            disabled={isPending}
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                item.isBanned 
                ? "bg-green-100 hover:bg-green-200 text-green-600" // Nút mở khóa
                : "bg-orange-100 hover:bg-orange-200 text-orange-600" // Nút khóa
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={item.isBanned ? "Mở khóa tài khoản" : "Khóa tài khoản"}
          >
            {item.isBanned ? (
                // Icon Unlocked (Mở khóa)
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
            ) : (
                // Icon Locked (Khóa)
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            )}
          </button>
          
      
        </div>
      </td>
    </tr>
  );

  // Layout 1 cột
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm h-full flex flex-col">
      {/* Top */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">
          Quản lý Người dùng ({count})
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
        
        </div>
      </div>
      
      {/* List */}
      <div className="flex-1 mt-4 overflow-x-auto">
        <Table columns={columns} renderRow={renderRow} data={data} />
      </div>
      
      {/* Pagination */}
      <div className="mt-4">
        <Pagination page={page} count={count} />
      </div>
    </div>
  );
};

export default UserList;