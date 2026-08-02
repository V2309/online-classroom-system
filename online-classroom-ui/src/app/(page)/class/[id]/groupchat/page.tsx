// app/(page)/class/[id]/groupchat/page.tsx
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { ChatBox } from "@/components/ChatGroup";
import { notFound } from "next/navigation";

interface PageProps {
  params: { id: string };
}

// Lấy tin nhắn cũ từ database
async function getInitialMessages(classCode: string) {
  try {
    // Kiểm tra lớp học có tồn tại không
    const classExists = await prisma.class.findUnique({
      where: { class_code: classCode }
    });

    if (!classExists) {
      return [];
    }
    

    // Lấy 50 tin nhắn gần nhất
    const messages = await prisma.message.findMany({
      where: { classCode },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            img: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Reverse để hiển thị theo thứ tự thời gian tăng dần
    return messages.reverse().map(msg => ({
      id: msg.id.toString(), // Convert number to string
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      isPinned: msg.isPinned || false,
      pinnedAt: msg.pinnedAt?.toISOString(),
      replyTo: msg.replyToId ? {
        id: msg.replyToId.toString(),
        content: msg.replyToContent || '',
        user: {
          id: 'unknown', 
          username: msg.replyToUsername || 'Unknown',
          img: null
        }
      } : undefined,
      user: {
        id: msg.user.id,
        username: msg.user.username,
        img: msg.user.img
      }
    }));
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

// Lấy tất cả thành viên trong lớp
async function getClassMembers(classCode: string) {
  try {
    const classData = await prisma.class.findUnique({
      where: { class_code: classCode },
      include: {
        students: {
          select: {
            id: true, // Student.id giống với User.id
            username: true,
            img: true,
          }
        },
        supervisor: {
          select: {
            id: true, // Teacher.id giống với User.id
            username: true,
            img: true,
          }
        }
      }
    });

    if (!classData) return [];

    // Kết hợp students và supervisor (teacher)
    // QUAN TRỌNG: Student.id và Teacher.id giống với User.id
    // nên sử dụng id trực tiếp để match với Pusher (dùng User.id)
    const allMembers: Array<{
      id: string;
      username: string;
      img: string | null;
      isOnline: boolean;
      role: 'student' | 'teacher';
    }> = [
      ...classData.students.map(s => ({
        id: s.id, // Student.id = User.id
        username: s.username,
        img: s.img,
        isOnline: false, // Sẽ được cập nhật bởi Pusher
        role: 'student' as const
      }))
    ];

    // Thêm supervisor nếu có
    if (classData.supervisor) {
      allMembers.push({
        id: classData.supervisor.id, // Teacher.id = User.id
        username: classData.supervisor.username,
        img: classData.supervisor.img,
        isOnline: false,
        role: 'teacher' as const
      });
    }

    return allMembers;
  } catch (error) {
    console.error("Error fetching class members:", error);
    return [];
  }
}

export default async function GroupChatPage({ params }: PageProps) {
  const classCode = params.id;

  // Kiểm tra lớp học có tồn tại không
  const classInfo = await prisma.class.findUnique({
    where: { class_code: classCode },
    select: {
      id: true,
      name: true,
      class_code: true,
    }
  });

  if (!classInfo) {
    notFound();
  }

  // Lấy tin nhắn ban đầu và thành viên lớp
  const initialMessages = await getInitialMessages(classCode);
  const allMembers = await getClassMembers(classCode);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Chat Container - chiếm toàn bộ phần còn lại */}
      <div className="h-full overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Đang tải chat...</p>
            </div>
          </div>
        }>
          <ChatBox 
            classCode={classCode} 
            initialMessages={initialMessages}
            allMembers={allMembers}
          />
        </Suspense>
      </div>
    </div>
  );
}

