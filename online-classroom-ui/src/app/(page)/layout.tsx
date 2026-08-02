'use client';
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
  const isAddPage = pathname?.includes("/homework/add")
  const isTestPage = pathname?.includes("/homework/") && pathname?.endsWith("/test");
  const isEditPage = pathname?.includes("/homework/") && pathname?.endsWith("/edit");
  const isResultPage = pathname?.includes("/homework/") && pathname?.endsWith("/detail");
  const isEditClassPage = pathname?.includes("/class/") && pathname?.endsWith("/edit");
  const isGroupChatPage = pathname?.includes("/groupchat"); // Group chat page
  const isMeetingPage = pathname?.includes("/meeting/"); // Meeting và room pages
  const isWhiteboardPage = pathname?.includes("/whiteboard"); // Whiteboard page
  const isEssayTestPage = pathname?.includes("/homework/") && pathname?.endsWith("/essay-test");
  // Nếu là meeting page thì không render layout này, để nó dùng layout riêng
  if (isMeetingPage) {
    return <>{children}</ >;  
  } 

  return (  
    
      <UserProvider>
        
          <div className="h-screen w-screen flex flex-col overflow-x-hidden">
            {/* Cấp 1: Navigation trên cùng */}
            {!isAddPage && !isTestPage && !isResultPage && !isEditPage && !isWhiteboardPage && !isEssayTestPage && (
              <div className="w-full flex-shrink-0 ">
                <Navigation />
              </div>
            )}
          {/* Cấp 2: Nội dung chính */}
          <div className={
            isAddPage || isTestPage || isResultPage  || isGroupChatPage || isEssayTestPage  
              ? "flex-grow flex flex-col bg-gray-100 overflow-hidden"
              : "flex-grow  flex flex-col bg-gray-100 overflow-y-auto"
          }>
            {children}
          </div>
        </div>
        <PusherListener />
        <PresenceManager />
        
      </UserProvider>
  
  );
}