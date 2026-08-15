// join/[classCode]/page.tsx
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import JoinClassConfirm from "@/components/JoinClassConfirm";
import { serverFetch } from "@/lib/server-api";

export type ClassInfoPayload = {
  id: number;
  name: string;
  class_code: string | null;
  img?: string | null;
  supervisor?: {
    username?: string;
    img?: string | null;
    user?: {
      username?: string;
      img?: string | null;
    };
  } | null;
};

export default async function JoinByCodePage({ params }: { params: { classCode: string } }) {
  const classCode = params.classCode.toUpperCase();
  const user = getCurrentUser();

  if (!user) {
    const callbackUrl = encodeURIComponent(`/join/${classCode}`);
    redirect(`/sign-in?next=${callbackUrl}`);
  }

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

  let classInfo: any = null;
  let myClasses: any = null;

  try {
    [classInfo, myClasses] = await Promise.all([
      serverFetch(`/classes/${classCode}`),
      serverFetch(`/classes`),
    ]);
  } catch (error) {
    console.error("Error fetching class for join:", error);
  }

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

  const enrolledClasses = Array.isArray(myClasses) ? myClasses : myClasses?.data || [];
  const isAlreadyJoined = enrolledClasses.some(
    (cls: any) => cls.class_code === classCode || cls.id === classInfo.id
  );

  // Normalize supervisor info
  const normalizedClassInfo: ClassInfoPayload = {
    id: classInfo.id,
    name: classInfo.name,
    class_code: classInfo.class_code,
    supervisor: {
      username: classInfo.supervisor?.user?.username || classInfo.supervisor?.username || 'Giáo viên',
      img: classInfo.supervisor?.user?.img || classInfo.supervisor?.img || null,
    },
  };

  return (
    <JoinClassConfirm 
      classInfo={normalizedClassInfo}
      isAlreadyJoined={isAlreadyJoined}
    />
  );
}
