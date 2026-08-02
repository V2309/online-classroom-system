import { Header } from "@/components/admin/header";
import {Sidebar} from "@/components/admin/sidebar"; // 
import { getCurrentUser } from "@/lib/auth"; // Hàm lấy user từ token của bạn (đã có ở các bước trước)

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Lấy thông tin user hiện tại trên Server
  const user = await getCurrentUser();

  // Chuẩn bị object user để truyền xuống (đề phòng user null)
  const userData = user ? {
    username: user.username,
    email: user.email,
    img: user.img,
    role: user.role
  } : null;

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar (Server Component hoặc Client đều được) */}
      <div className="hidden border-r bg-muted/40 md:block">
         <Sidebar /> 
      </div>

      <div className="flex flex-col">
        {/* 2. Truyền user xuống Header */}
        <Header user={userData} />
        
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}