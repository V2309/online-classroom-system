'use client';

import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import Navigation from "@/components/Navigation";
import { usePathname } from "next/navigation";
import { UserProvider } from "@/providers/UserProvider";
import PusherListener from "@/components/PusherListener";
import PresenceManager from "@/components/PresenceManager";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAddPage = pathname?.includes("/homework/add");
  const isTestPage = pathname?.includes("/homework/") && pathname?.endsWith("/test");
  const isEditPage = pathname?.includes("/homework/") && pathname?.endsWith("/edit");
  const isResultPage = pathname?.includes("/homework/") && pathname?.endsWith("/detail");
  const isMeetingPage = pathname?.includes("/meeting/");
  const isWhiteboardPage = pathname?.includes("/whiteboard");
  const isEssayTestPage = pathname?.includes("/homework/") && pathname?.endsWith("/essay-test");
  const isSchedulePage = pathname?.includes("/schedule");
  const isHomeworkListPage = pathname?.includes("/homework/list");
  const isMemberPage = pathname?.includes("/member");
  const isGroupChatPage = pathname?.includes("/groupchat");

  // Kiểm tra nếu đang ở bên trong 1 lớp học cụ thể (ví dụ /class/ABC123/...)
  const isInsideClass = pathname ? /^\/class\/[^/]+/.test(pathname) : false;

  if (isMeetingPage) {
    return <>{children}</>;
  }

  const isSpecialFullscreenPage = isAddPage || isTestPage || isResultPage || isEditPage || isWhiteboardPage || isEssayTestPage;

  // 1. TRƯỜNG HỢP 1: BÊN TRONG 1 LỚP HỌC (Dùng thanh ngang trên cùng Navigation như cũ)
  if (isInsideClass) {
    return (
      <UserProvider>
        <div className="h-screen w-full max-w-full flex flex-col overflow-hidden bg-background text-foreground">
          {/* Thanh ngang trên cùng */}
          {!isSpecialFullscreenPage && (
            <div className="w-full flex-shrink-0">
              <Navigation />
            </div>
          )}

          {/* Vùng nội dung lớp học (chứa ClassLayoutWrapper với MenuClass bên trái) */}
          <div
            className={`flex-1 min-w-0 min-h-0 ${
              isSpecialFullscreenPage || isSchedulePage || isHomeworkListPage || isMemberPage || isGroupChatPage
                ? "overflow-hidden flex flex-col"
                : "overflow-y-auto overflow-x-hidden scrollbar-thin"
            }`}
          >
            {children}
          </div>
        </div>
        <PusherListener />
        <PresenceManager />
      </UserProvider>
    );
  }

  // 2. TRƯỜNG HỢP 2: CÁC TRANG NGOÀI LỚP HỌC (Tổng quan, Danh sách lớp, Lịch tổng, Phòng họp, v.v.)
  return (
    <UserProvider>
      <div className="h-screen w-full max-w-full flex overflow-hidden bg-background text-foreground">
        {/* Cột trái: Sidebar ứng dụng (Logo + Menu) */}
        {!isSpecialFullscreenPage && <AppSidebar />}

        {/* Cột phải: Header trên cùng + Vùng Content */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Header trên cùng */}
          {!isSpecialFullscreenPage && <AppHeader />}

          {/* Vùng nội dung */}
          <main
            className={`flex-1 min-w-0 min-h-0 ${
              isSchedulePage || isHomeworkListPage || isMemberPage || isGroupChatPage
                ? "overflow-hidden flex flex-col"
                : "overflow-y-auto overflow-x-hidden scrollbar-thin"
            }`}
          >
            {children}
          </main>
        </div>
      </div>
      <PusherListener />
      <PresenceManager />
    </UserProvider>
  );
}