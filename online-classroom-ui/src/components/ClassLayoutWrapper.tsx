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

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Menu bên trái */}
      <div className="w-[25%] md:w-[20%] lg:w-[18%] h-full bg-white shadow-md border-r border-gray-400 flex-shrink-0 ">
        <MenuClass classDetail={classDetail} role={role as "teacher" | "student"} pendingRequestCount={pendingRequestCount} />
      </div>

      {/* Nội dung bên phải - CHỈ scroll area này */}
      <div 
        id="class-content-scroll" 
        className="flex-1 h-full bg-white overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 "
      >
        {children}
      </div>
    </div>
  );
}