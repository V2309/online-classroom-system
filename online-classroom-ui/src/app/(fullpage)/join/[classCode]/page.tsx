
// join/[classCode]/page.tsx
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import JoinClassConfirm from "@/components/JoinClassConfirm";
import { Prisma } from "@prisma/client";

// Lấy kiểu dữ liệu chi tiết của Lớp học (bao gồm cả giáo viên)
export type ClassInfoPayload = Prisma.ClassGetPayload<{
  include: { 
    supervisor: { 
      select: { username: true, img: true } 
    } 
  }
}>;

// Lấy kiểu dữ liệu chi tiết của Học sinh (bao gồm các lớp đã tham gia)
export type StudentInfoPayload = Prisma.StudentGetPayload<{
  include: { classes: { select: { id: true } } }
}>;


export default async function JoinByCodePage({ params }: { params: { classCode: string } }) {
  const classCode = params.classCode.toUpperCase();

  // 1. Lấy thông tin user hiện tại (chạy song song với lấy thông tin lớp)
  const user = await getCurrentUser();

  // 2. Nếu chưa đăng nhập, đá về trang sign-in (với ?next=... để quay lại)
  if (!user) {
    const callbackUrl = encodeURIComponent(`/join/${classCode}`);
    redirect(`/sign-in?next=${callbackUrl}`);
  }

  // 3. Nếu không phải là học sinh, không cho tham gia
  if (user.role !== 'student') {
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center p-4">
        <div className="text-center text-red-700">
          <h1 className="text-2xl font-bold">Lỗi truy cập</h1>
          <p>Chỉ học sinh mới có thể tham gia lớp học.</p>
        </div>
      </div>
    );
  }

  // 4. Lấy thông tin lớp và thông tin học sinh CÙNG LÚC (Tối ưu)
  const [classInfo, student] = await Promise.all([
    // Lấy thông tin lớp
    prisma.class.findUnique({
      where: { class_code: classCode },
      include: {
        supervisor: { // Lấy tên và ảnh giáo viên
          select: { username: true, img: true }
        }
      }
    }),
    // Lấy thông tin học sinh
    prisma.student.findUnique({
      where: { userId: user.id as string },
      include: {
        classes: { // Lấy danh sách lớp đã tham gia (chỉ cần ID)
          select: { id: true }
        }
      }
    })
  ]);

  // 5. Xử lý lỗi
  if (!classInfo) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center text-gray-700">
          <h1 className="text-2xl font-bold">Lớp học không tồn tại</h1>
          <p>Mã lớp {classCode} không tìm thấy. Vui lòng kiểm tra lại.</p>
        </div>
      </div>
    );
  }
  
  if (!student) {
     return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center text-gray-700">
          <h1 className="text-2xl font-bold">Lỗi Tài khoản</h1>
          <p>Không tìm thấy thông tin học sinh của bạn.</p>
        </div>
      </div>
    );
  }

  // 6. Kiểm tra xem học sinh đã ở trong lớp chưa
  const isAlreadyJoined = student.classes.some(cls => cls.id === classInfo.id);

  // 7. Render Client Component với dữ liệu đã lấy
  return (
    <JoinClassConfirm 
      classInfo={classInfo}
      isAlreadyJoined={isAlreadyJoined}
    />
  );
}
