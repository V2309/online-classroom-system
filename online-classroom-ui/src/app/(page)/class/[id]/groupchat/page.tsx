import { Suspense } from "react";
import { ChatBox } from "@/components/ChatGroup";
import { serverFetch } from "@/lib/server-api";
import { InitialChatDataResponse } from "@/types/chat";

interface PageProps {
  params: { id: string };
}

export default async function GroupChatPage({ params }: PageProps) {
  const classCode = params.id;

  let initialData: InitialChatDataResponse = {
    messages: [],
    allMembers: [],
  };

  try {
    initialData = await serverFetch<InitialChatDataResponse>(
      `/chat/class/${classCode}/initial`
    );
  } catch (error) {
    console.error("Lỗi lấy dữ liệu chat ban đầu:", error);
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="h-full overflow-hidden">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Đang tải chat...</p>
              </div>
            </div>
          }
        >
          <ChatBox
            classCode={classCode}
            initialMessages={initialData.messages || []}
            allMembers={initialData.allMembers || []}
          />
        </Suspense>
      </div>
    </div>
  );
}
