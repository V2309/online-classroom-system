import ClassLayoutWrapper from "@/components/ClassLayoutWrapper";
import { getCurrentUser } from "@/lib/auth-server";
import { serverFetch } from "@/lib/server-api";
import QueryProvider from "@/providers/QueryProvider";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ClassLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { id: string };
}>) {
  // 1. Lấy thông tin user hiện tại từ Cookie JWT
  const user = getCurrentUser();

  if (!user) {
    const callbackUrl = encodeURIComponent(`/class/${params.id}`);
    redirect(`/sign-in?next=${callbackUrl}`);
  }

  if (user.role !== "teacher" && user.role !== "student") {
    return (
      <div className="flex items-center justify-center h-screen bg-background p-4">
        <div className="text-center p-8 bg-card border border-border rounded-2xl shadow-sm max-w-md">
          <h1 className="text-2xl font-bold text-destructive">Lỗi Phân Quyền</h1>
          <p className="text-secondary mt-2">Vai trò của bạn không được phép truy cập trang này.</p>
          <Link href="/" className="text-primary hover:text-primary-hover font-medium mt-4 inline-block">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // 2. Lấy thông tin lớp học từ NestJS qua serverFetch
  let classDetail: any = null;
  try {
    classDetail = await serverFetch(`/classes/${params.id}`);
  } catch (error) {
    console.error("Lỗi tải thông tin lớp học:", error);
    classDetail = null;
  }

  if (!classDetail) {
    return (
      <div className="flex items-center justify-center h-screen bg-background p-4">
        <div className="text-center p-8 bg-card border border-border rounded-2xl shadow-sm max-w-md">
          <h1 className="text-2xl font-bold text-destructive">Không tìm thấy lớp học</h1>
          <p className="text-secondary mt-2">Lớp học không tồn tại hoặc bạn không có quyền truy cập.</p>
          <Link href="/class" className="text-primary hover:text-primary-hover font-medium mt-4 inline-block">
            Quay về danh sách lớp
          </Link>
        </div>
      </div>
    );
  }

  // 3. Nếu là giáo viên, lấy số lượng yêu cầu chờ duyệt
  let pendingRequestCount = 0;
  if (user.role === "teacher" && classDetail.id) {
    try {
      const requests = await serverFetch(`/classes/${classDetail.id}/join-requests`);
      pendingRequestCount = Array.isArray(requests) ? requests.length : 0;
    } catch {
      pendingRequestCount = 0;
    }
  }

  return (
    <QueryProvider>
      <ClassLayoutWrapper
        classDetail={classDetail}
        role={user.role as string}
        pendingRequestCount={pendingRequestCount}
      >
        {children}
      </ClassLayoutWrapper>
    </QueryProvider>
  );
}