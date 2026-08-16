"use client";

import { usePathname } from "next/navigation";
import MenuClass from "@/components/MenuClass";

interface ClassLayoutWrapperProps {
  children: React.ReactNode;
  classDetail: any;
  role: string;
  pendingRequestCount: number;
}

export default function ClassLayoutWrapper({ children, classDetail, role, pendingRequestCount }: ClassLayoutWrapperProps) {
  const pathname = usePathname();
  
  // Ẩn layout cho các trang đặc biệt
  const hideLayoutRoutes = [
    "/homework/add",
    "/homework/",
    "/test",
    "/detail", 
    "/edit",
    "/whiteboard",
    "/homework/essay-test"
  ];
  
  const shouldHideLayout = hideLayoutRoutes.some(route => {
    if (route === "/homework/") {
      return pathname.includes("/homework/") && (pathname.endsWith("/test") || pathname.endsWith("/detail") || pathname.endsWith("/essay-test"));
    }
    return pathname.includes(route);
  });

  if (shouldHideLayout) {
    return <>{children}</>;
  }

  const isNoScrollPage = pathname?.includes("/schedule") || pathname?.includes("/homework/list") || pathname?.includes("/member") || pathname?.includes("/groupchat");

  return (
    <div className="h-full w-full max-w-full flex overflow-hidden bg-background text-foreground">
      {/* Menu bên trái */}
      <div className="w-[25%] md:w-[20%] lg:w-[18%] h-full bg-card shadow-sm border-r border-border flex-shrink-0">
        <MenuClass classDetail={classDetail} role={role as "teacher" | "student"} pendingRequestCount={pendingRequestCount} />
      </div>

      {/* Nội dung bên phải */}
      <div 
        id="class-content-scroll" 
        className={`flex-1 h-full bg-background text-foreground ${isNoScrollPage ? "overflow-hidden flex flex-col" : "overflow-y-auto overflow-x-hidden scrollbar-thin"} min-w-0`}
      >
        {children}
      </div>
    </div>
  );
}