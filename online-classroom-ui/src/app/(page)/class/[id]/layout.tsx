import prisma from "@/lib/prisma";
import ClassLayoutWrapper from "@/components/ClassLayoutWrapper";
import { getCurrentUser } from "@/lib/auth";
import QueryProvider from "@/providers/QueryProvider";
import { Prisma } from "@prisma/client"; // Import Prisma
import { redirect } from "next/navigation";
import Link from "next/link"; // Import Link để tạo nút "Quay lại"

export default async function ClassLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { id: string; }; 
}>) {
  
  // 1. Lấy thông tin user ĐẦU TIÊN (bắt buộc cho việc xác thực)
  const user = await getCurrentUser();

  if (!user) {
    // Nếu chưa đăng nhập, chuyển hướng về sign-in và lưu lại trang này
    const callbackUrl = encodeURIComponent(`/class/${params.id}`);
    redirect(`/sign-in?next=${callbackUrl}`);
  }
  
  // 2. Xây dựng truy vấn xác thực (Authorization query)
  let authCheckWhere: Prisma.ClassWhereInput;

  if (user.role === 'teacher') {
    // Giáo viên phải là người giám sát (supervisor) của lớp này
    authCheckWhere = {
      class_code: params.id,
      deleted: false, // Đảm bảo lớp chưa bị xóa
      supervisor: {
        userId: user.id as string
      }
    };
  } else if (user.role === 'student') {
    // Học sinh phải nằm trong danh sách `students` của lớp
    authCheckWhere = {
      class_code: params.id,
      deleted: false, // Đảm bảo lớp chưa bị xóa
      students: {
        some: {
          userId: user.id as string
        }
      }
    };
  } else {
    // Các role khác (nếu có) không có quyền
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600">Lỗi Phân Quyền</h1>
          <p className="text-gray-700 mt-2">Vai trò của bạn không được phép truy cập trang này.</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // 3. Chạy truy vấn duy nhất để lấy chi tiết lớp (đã bao gồm xác thực)
  // Dùng findFirst thay vì findUnique vì ta query bằng class_code
  const classDetail = await prisma.class.findFirst({
    where: authCheckWhere,
    select: {
      id: true,
      name: true,
      class_code: true,
      capacity: true,
      grade: {
        select: { level: true }
      },
      supervisor: {
        select: { username: true, img: true }
      },
      _count: {
        select: { students: true }
      }
    },
  });

  // 4. Nếu classDetail là null -> Lớp không tồn tại HOẶC User không có quyền
  if (!classDetail) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600">Không tìm thấy lớp học</h1>
          <p className="text-gray-700 mt-2">Lớp học không tồn tại hoặc bạn không có quyền truy cập.</p>
          <Link href="/class" className="text-blue-600 hover:underline mt-4 inline-block">
            Quay về danh sách lớp
          </Link>
        </div>
      </div>
    );
  }
let pendingRequestCount = 0;
if (user.role === 'teacher') {
    // Chỉ giáo viên mới cần đếm yêu cầu chờ
    pendingRequestCount = await prisma.classJoinRequest.count({
        where: {
            classCode: classDetail.class_code,
            status: 'PENDING'
        }
    });
}
  // 5. Gửi dữ liệu đã được tối ưu xuống Client Component
  return (
   <QueryProvider>
     <ClassLayoutWrapper classDetail={classDetail} role={user.role as string} pendingRequestCount={pendingRequestCount}>
      {children}
     </ClassLayoutWrapper>
   </QueryProvider>
  );
}