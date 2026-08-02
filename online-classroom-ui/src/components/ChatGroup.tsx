// components/ChatBox.tsx
"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { useUser } from "@/hooks/useUser";
import { pusherClient } from "@/lib/pusher-client";
import { type Channel, type Members } from "pusher-js";
import { sendMessage, deleteMessage, recallMessage, pinMessage, unpinMessage, getPinnedMessages } from "@/lib/actions/chat.action";
import { toast } from "react-toastify";
import { globalPresenceManager } from "@/lib/presence-manager";

import Image from "next/image";
// Type cho tin nhắn
interface ChatGroupMessage {
  id: string;
  content: string;
  createdAt: string;
  replyTo?: {
    id: string;
    content: string;
    user: {
      id: string;
      username: string;
      img: string | null;
    };
  };
  user: {
    id: string;
    username: string;
    img: string | null;
  };
  isPinned?: boolean;
  pinnedAt?: string;
}

// Type cho thành viên online (từ Presence Channel)
interface Member {
  id: string;
  info: {
    username: string;
    img: string | null;
  };
}

// Type cho thành viên trong lớp (bao gồm cả online và offline)
interface ClassMember {
  id: string;
  username: string;
  img: string | null;
  isOnline: boolean;
  lastSeen?: Date;
}

// Type cho thông báo hệ thống
interface SystemMessage {
  id: string;
  type: "system";
  content: string;
  createdAt: string;
}

// Type cho date separator
interface DateSeparator {
  id: string;
  type: "date";
  date: string;
}

// Helper functions for date formatting
const formatDateSeparator = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const messageDate = new Date(date);
  
  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  messageDate.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - messageDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (messageDate.getTime() === today.getTime()) {
    return "Hôm nay";
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return "Hôm qua";
  } else if (diffDays <= 7) {
    return messageDate.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit'
    });
  } else {
    return messageDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
};

const shouldShowDateSeparator = (currentMsg: ChatGroupMessage | SystemMessage, prevMsg: ChatGroupMessage | SystemMessage | null): boolean => {
  if (!prevMsg) return true;
  
  const currentDate = new Date(currentMsg.createdAt);
  const prevDate = new Date(prevMsg.createdAt);
  
  return currentDate.toDateString() !== prevDate.toDateString();
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface ChatBoxProps {
  classCode: string;
  initialMessages: ChatGroupMessage[]; // Tải tin nhắn cũ từ Server Component
  allMembers?: ClassMember[]; // Tất cả thành viên trong lớp
}

export function ChatBox({
  classCode,
  initialMessages,
  allMembers = [],
}: ChatBoxProps) {
  const { user } = useUser();
  const [messages, setMessages] =
    useState<(ChatGroupMessage | SystemMessage)[]>(initialMessages);
  const [onlineMembers, setOnlineMembers] = useState<Member[]>([]);
  const [classMembers, setClassMembers] = useState<ClassMember[]>(allMembers);
  const [newMessage, setNewMessage] = useState("");
  const channelRef = useRef<Channel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastSentRef = useRef<{content: string, timestamp: number} | null>(null);

  // Cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: "smooth",
        block: "end",
        inline: "nearest"
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    if (!user || !classCode) return;



    // Lấy channel từ globalPresenceManager hoặc đợi nó được tạo
    const setupChannelListeners = async () => {
      try {
        // Đảm bảo channel đã được subscribe
        let channel = globalPresenceManager.getChannel(classCode);
        
        if (!channel) {
        
          channel = await globalPresenceManager.subscribeToClass(classCode);
        }
        
        if (!channel) {
         
          return;
        }
        
        channelRef.current = channel;
   

        // Lấy members hiện tại ngay lập tức
        const currentMembers = globalPresenceManager.getCurrentMembers(classCode);
        if (currentMembers.length > 0) {
          setOnlineMembers(currentMembers);
        

          // Cập nhật trạng thái online cho class members
          setClassMembers((prev) => {
            return prev.map((m) => {
              const isOnline = currentMembers.some((om) => String(om.id) === String(m.id));
        
              return {
                ...m,
                isOnline,
              };
            });
          });
        } else {
          // Nếu không lấy được ngay, thử lại sau 500ms
          setTimeout(() => {
            const retryMembers = globalPresenceManager.getCurrentMembers(classCode);
            if (retryMembers.length > 0) {
              setOnlineMembers(retryMembers);
              setClassMembers((prev) => {
                return prev.map((m) => {
                  const isOnline = retryMembers.some((om) => String(om.id) === String(m.id));
                  return {
                    ...m,
                    isOnline,
                  };
                });
              });
             
            }
          }, 500);
        }

      // Log khi channel có lỗi
      channel.bind("pusher:subscription_error", (error: any) => {
        console.error("[ChatGroup] Subscription error:", error);
        console.error("[ChatGroup] Error type:", error.type);
        console.error("[ChatGroup] Error details:", JSON.stringify(error, null, 2));
      });

      // Log connection status
      pusherClient.connection.bind("connected", () => {
        console.log("[ChatGroup] Pusher connected");
      });

    pusherClient.connection.bind("error", (err: any) => {
      console.error("[ChatGroup] Pusher connection error:", err);
      console.error("[ChatGroup] Error type:", err.type);
      console.error("[ChatGroup] Error data:", JSON.stringify(err.data, null, 2));
      if (err.data?.message) {
        console.error("[ChatGroup] Error message:", err.data.message);
      }
      if (err.data?.code) {
        console.error("[ChatGroup] Error code:", err.data.code);
      }
    });

      pusherClient.connection.bind("disconnected", () => {
        console.log("[ChatGroup] Pusher disconnected");
      });

        // 4. Lắng nghe sự kiện "new-message" (tin nhắn mới)
        channel.bind("new-message", (data: ChatGroupMessage) => {
          setMessages((prev) => {
            // Kiểm tra duplicate theo ID
            if (prev.find((msg) => msg.id === data.id)) {
              return prev;
            }
            
            // Nếu là tin nhắn của chính mình, thay thế optimistic message
            if (data.user.id === user?.id) {
              // Tìm và xóa optimistic message cùng nội dung
              const withoutOptimistic = prev.filter(msg => {
                if (msg.id.startsWith('temp-') && 'user' in msg) {
                  const chatMsg = msg as ChatGroupMessage;
                  return !(chatMsg.user.id === data.user.id && chatMsg.content === data.content);
                }
                return true;
              });
              return [...withoutOptimistic, data];
            }
            
            // Tin nhắn từ người khác
            return [...prev, data];
          });
        });

        // Lắng nghe sự kiện xóa tin nhắn
        channel.bind("message-deleted", (data: { messageId: string, userId: string }) => {
          setMessages((prev) => prev.filter(msg => msg.id !== data.messageId));
        });

        // Lắng nghe sự kiện thu hồi tin nhắn
        channel.bind("message-recalled", (data: { messageId: string, content: string, userId: string }) => {
          setMessages((prev) => prev.map(msg => 
            msg.id === data.messageId 
              ? { ...msg, content: data.content }
              : msg
          ));
        });

        // Lắng nghe sự kiện ghim tin nhắn
        channel.bind("message-pinned", (data: { messageId: string, pinnedAt: string, userId: string }) => {
          setMessages((prev) => prev.map(msg => 
            msg.id === data.messageId 
              ? { ...msg, isPinned: true, pinnedAt: data.pinnedAt }
              : msg
          ));
        });

        // Lắng nghe sự kiện bỏ ghim tin nhắn
        channel.bind("message-unpinned", (data: { messageId: string, userId: string }) => {
          setMessages((prev) => prev.map(msg => 
            msg.id === data.messageId 
              ? { ...msg, isPinned: false, pinnedAt: undefined }
              : msg
          ));
        });

    // 4. Lắng nghe "who's online" (Presence Events)

      // Vẫn bind subscription_succeeded để handle trường hợp channel mới được tạo
      channel.bind("pusher:subscription_succeeded", (members: Members) => {
        const memberArray: Member[] = [];
        members.each((member: Member) => memberArray.push(member));
        
        // Chỉ update nếu chưa có members hoặc số lượng khác
        setOnlineMembers(prev => {
          if (prev.length === 0 || prev.length !== memberArray.length) {
            console.log(`[ChatGroup] Subscription succeeded - updating members: ${memberArray.length}`);
            
            // Cập nhật trạng thái online cho class members
            setClassMembers((prevClass) => {
              return prevClass.map((m) => {
                const isOnline = memberArray.some((om) => String(om.id) === String(m.id));
                return {
                  ...m,
                  isOnline,
                };
              });
            });
            
            return memberArray;
          }
          return prev;
        });
      });

    // Khi có người mới tham gia
    channel.bind("pusher:member_added", (member: Member) => {
      setOnlineMembers((prev) => {
        // Tránh duplicate
        if (prev.some(m => String(m.id) === String(member.id))) {
          return prev;
        }
        return [...prev, member];
      });

      // Cập nhật trạng thái online trong classMembers
      // Đảm bảo so sánh ID dạng string
      setClassMembers((prev) =>
        prev.map((m) => (String(m.id) === String(member.id) ? { ...m, isOnline: true } : m))
      );

      // Thêm thông báo hệ thống
      const systemMessage: SystemMessage = {
        id: `system-join-${member.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "system",
        content: `${member.info.username} đã tham gia chat`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, systemMessage]);
    });

    // Khi có người rời đi
    channel.bind("pusher:member_removed", (member: Member) => {
      setOnlineMembers((prev) => prev.filter((m) => String(m.id) !== String(member.id)));

      // Cập nhật trạng thái offline và lastSeen trong classMembers
      // Đảm bảo so sánh ID dạng string
      setClassMembers((prev) =>
        prev.map((m) =>
          String(m.id) === String(member.id)
            ? { ...m, isOnline: false, lastSeen: new Date() }
            : m
        )
      );

      // Thêm thông báo hệ thống
      const systemMessage: SystemMessage = {
        id: `system-leave-${member.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "system",
        content: `${member.info.username} đã rời khỏi chat`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, systemMessage]);
      });
      } catch (error) {
        console.error("[ChatGroup] Error setting up channel listeners:", error);
      }
    };

    // Gọi setup function
    setupChannelListeners();

    // 5. Dọn dẹp - chỉ xóa listeners, không unsubscribe
    return () => {
      if (channelRef.current) {
        // Xóa các event listeners
        channelRef.current.unbind("new-message");
        channelRef.current.unbind("message-deleted");
        channelRef.current.unbind("message-recalled");
        channelRef.current.unbind("message-pinned");
        channelRef.current.unbind("message-unpinned");
        channelRef.current.unbind("pusher:member_added");
        channelRef.current.unbind("pusher:member_removed");
        channelRef.current.unbind("pusher:subscription_succeeded");
        channelRef.current = null;
      }
    };
  }, [user, classCode]);

  // Hàm gửi tin nhắn
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatGroupMessage | null>(null);
  const [showMenuFor, setShowMenuFor] = useState<string | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<ChatGroupMessage[]>([]);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMenuFor(null);
    };

    if (showMenuFor) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMenuFor]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isSubmitting) return;
    
    // Kiểm tra duplicate trong vòng 2 giây
    const now = Date.now();
    if (lastSentRef.current && 
        lastSentRef.current.content === newMessage.trim() && 
        now - lastSentRef.current.timestamp < 2000) {
      console.log('[ChatGroup] Duplicate message prevented');
      return;
    }
    
    setIsSubmitting(true);
    lastSentRef.current = { content: newMessage.trim(), timestamp: now };

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: ChatGroupMessage = {
      id: optimisticId,
      content: newMessage,
      createdAt: new Date().toISOString(),
      replyTo: replyTo ? {
        id: replyTo.id,
        content: replyTo.content,
        user: replyTo.user
      } : undefined,
      user: {
        id: user.id,
        username: user.username,
        img: user.img || null,
      },
    };

    const messageContent = newMessage;
    const replyData = replyTo;
    
    // Thêm tin nhắn của mình vào UI ngay lập tức
    setMessages((prev) => {
      // Cleanup old optimistic messages (older than 30 seconds)
      const thirtySecondsAgo = Date.now() - 30000;
      const cleaned = prev.filter(msg => {
        if (msg.id.startsWith('temp-')) {
          const timestamp = parseInt(msg.id.split('-')[1]);
          return timestamp > thirtySecondsAgo;
        }
        return true;
      });
      
      return [...cleaned, optimisticMessage];
    });
    setNewMessage("");
    setReplyTo(null);

    try {
      // Gửi lên server
      const result = await sendMessage({ 
        content: messageContent, 
        classCode,
        replyTo: replyData ? {
          id: replyData.id,
          content: replyData.content,
          user: replyData.user
        } : undefined
      });

      if (result.error) {
        toast.error(result.error);
        // Xóa tin nhắn lạc quan nếu lỗi
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
      }
      // Khi thành công, Pusher sẽ gửi lại và thay thế optimistic message
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Gửi tin nhắn thất bại');
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const result = await deleteMessage(messageId, classCode);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Tin nhắn đã được xóa');
      }
    } catch (error) {
      toast.error('Xóa tin nhắn thất bại');
    }
  };

  // Handle recall message
  const handleRecallMessage = async (messageId: string) => {
    try {
      const result = await recallMessage(messageId, classCode);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Tin nhắn đã được thu hồi');
      }
    } catch (error) {
      toast.error('Thu hồi tin nhắn thất bại');
    }
  };

  // Handle pin message
  const handlePinMessage = async (messageId: string) => {
    try {
      // Optimistic update
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isPinned: true, pinnedAt: new Date().toISOString() }
          : msg
      ));
      
      const result = await pinMessage(messageId, classCode);
      if (result.error) {
        toast.error(result.error);
        // Revert optimistic update on error
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isPinned: false, pinnedAt: undefined }
            : msg
        ));
      } else {
        toast.success('Tin nhắn đã được ghim');
      }
    } catch (error) {
      toast.error('Ghim tin nhắn thất bại');
      // Revert optimistic update on error
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isPinned: false, pinnedAt: undefined }
          : msg
      ));
    }
  };

  // Handle unpin message
  const handleUnpinMessage = async (messageId: string) => {
    try {
      // Optimistic update
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isPinned: false, pinnedAt: undefined }
          : msg
      ));
      
      const result = await unpinMessage(messageId, classCode);
      if (result.error) {
        toast.error(result.error);
        // Revert optimistic update on error
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isPinned: true, pinnedAt: new Date().toISOString() }
          : msg
        ));
      } else {
        toast.success('Đã bỏ ghim tin nhắn');
      }
    } catch (error) {
      toast.error('Bỏ ghim tin nhắn thất bại');
      // Revert optimistic update on error
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isPinned: true, pinnedAt: new Date().toISOString() }
          : msg
      ));
    }
  };

  return (
    <div className="flex h-full w-full bg-gray-50 overflow-hidden">
      {/* Cột chính (Chat) */}
      <div className="flex-1 flex flex-col bg-white border-r border-gray-200 min-h-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-800">Chat nhóm</h2>
          <p className="text-sm text-gray-500">Lớp {classCode}</p>
        </div>
        
        {/* Pinned Messages Section */}
        {messages.filter(msg => !("type" in msg) && (msg as ChatGroupMessage).isPinned).length > 0 && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 2a1 1 0 000 2h4a1 1 0 100-2H8zM3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM4 10a1 1 0 011-1h8a1 1 0 110 2H5a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-yellow-800">Tin nhắn đã ghim</span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {messages.filter(msg => !("type" in msg) && (msg as ChatGroupMessage).isPinned).map(msg => {
                const pinnedMsg = msg as ChatGroupMessage;
                return (
                  <div key={`pinned-${pinnedMsg.id}`} className="bg-white rounded-lg p-2 shadow-sm border border-yellow-200">
                    <div className="flex items-start gap-2">
                      <Image
                        src={
                          pinnedMsg.user.img
                            ? `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}${pinnedMsg.user.img}`
                            : "/avatar.png"
                        }
                        alt={pinnedMsg.user.username}
                        width={24}
                        height={24}
                        className="rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-700">{pinnedMsg.user.username}</span>
                          <span className="text-xs text-gray-500">
                            {formatTime(new Date(pinnedMsg.createdAt))}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 break-words">
                          {pinnedMsg.content.length > 100 
                            ? pinnedMsg.content.substring(0, 100) + '...' 
                            : pinnedMsg.content
                          }
                        </p>
                      </div>
                      <button
                        onClick={() => handleUnpinMessage(pinnedMsg.id)}
                        className="p-1 text-yellow-600 hover:text-yellow-800 transition-colors flex-shrink-0"
                        title="Bỏ ghim"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Khung chat (cuộn) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 min-h-0">
          {messages.map((msg, index) => {
            const elements = [];
            
            // Check if we need to show date separator
            const prevMsg = index > 0 ? messages[index - 1] : null;
            if (shouldShowDateSeparator(msg, prevMsg)) {
              elements.push(
                <div key={`date-${msg.id}`} className="flex justify-center my-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-gray-50 px-4 py-1 text-gray-500 font-medium rounded-full shadow-sm border border-gray-200">
                        {formatDateSeparator(new Date(msg.createdAt))}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            
            // Render system message ở giữa
            if ("type" in msg && msg.type === "system") {
              elements.push(
                <div key={msg.id} className="flex justify-center my-4">
                  <div className="bg-blue-100 text-blue-600 text-xs px-4 py-2 rounded-full border border-blue-200">
                    <span className="font-medium">{msg.content}</span>
                  </div>
                </div>
              );
              return elements;
            }

            // Render normal chat message
            const chatMsg = msg as ChatGroupMessage;
            const isMyMessage = chatMsg.user.id === user?.id;
            
            const messageElement = (
              <div
                key={chatMsg.id}
                className={`flex gap-3 mb-4 ${
                  isMyMessage ? "justify-end" : "justify-start"
                }`}
              >
                {/* Avatar cho tin nhắn của người khác */}
                {!isMyMessage && (
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <Image
                        src={
                          chatMsg.user.img
                            ? `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}${chatMsg.user.img}`
                            : "/avatar.png"
                        }
                        alt={chatMsg.user.username}
                        width={40}
                        height={40}
                        className="rounded-full ring-2 ring-white shadow-sm"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                    </div>
                  </div>
                )}
                
                {/* Message content */}
                <div className={`flex flex-col max-w-xs lg:max-w-md ${
                  isMyMessage ? "items-end" : "items-start"
                }`}>
                  {/* Tên người gửi (chỉ hiện với tin nhắn của người khác) */}
                  {!isMyMessage && (
                    <span className="text-xs text-gray-500 mb-1 ml-3 font-medium">
                      {chatMsg.user.username}
                    </span>
                  )}
                  
                  {/* Bubble chat */}
                  <div className="relative group">
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm ${
                        isMyMessage
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                          : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                      }`}
                    >
                      {/* Reply preview */}
                      {chatMsg.replyTo && (
                        <div className={`mb-2 p-2 rounded-lg border-l-2 ${
                          isMyMessage 
                            ? "bg-blue-400/20 border-blue-200" 
                            : "bg-gray-100 border-gray-300"
                        }`}>
                          <p className={`text-xs font-medium ${
                            isMyMessage ? "text-blue-100" : "text-gray-600"
                          }`}>
                            {chatMsg.replyTo.user.username}
                          </p>
                          <p className={`text-xs ${
                            isMyMessage ? "text-blue-100" : "text-gray-500"
                          }`}>
                            {chatMsg.replyTo.content.length > 50 
                              ? chatMsg.replyTo.content.substring(0, 50) + '...' 
                              : chatMsg.replyTo.content
                            }
                          </p>
                        </div>
                      )}
                      
                      <p className="text-sm leading-relaxed">{chatMsg.content}</p>
                      <p className={`text-xs mt-2 ${
                        isMyMessage ? "text-blue-100" : "text-gray-400"
                      }`}>
                        {new Date(chatMsg.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    {/* Message actions */}
                    <div className={`absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isMyMessage ? "-left-16" : "-right-16"
                    }`}>
                      <button
                        onClick={() => setReplyTo(chatMsg)}
                        className="p-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                        title="Trả lời"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                      
                      <div className="relative">
                        <button
                          onClick={() => setShowMenuFor(showMenuFor === chatMsg.id ? null : chatMsg.id)}
                          className="p-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                          title="Tùy chọn"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        
                        {/* Menu dropdown */}
                        {showMenuFor === chatMsg.id && (
                          <div className={`absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-32 ${
                            isMyMessage ? "right-0" : "left-0"
                          }`}>
                            {isMyMessage && (
                              <>
                                <button
                                  onClick={() => {
                                    handleDeleteMessage(chatMsg.id);
                                    setShowMenuFor(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  Xóa tin nhắn
                                </button>
                                <button
                                  onClick={() => {
                                    handleRecallMessage(chatMsg.id);
                                    setShowMenuFor(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  Thu hồi
                                </button>
                                <hr className="my-1" />
                                <button
                                  onClick={() => {
                                    if (chatMsg.isPinned) {
                                      handleUnpinMessage(chatMsg.id);
                                    } else {
                                      handlePinMessage(chatMsg.id);
                                    }
                                    setShowMenuFor(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                  {chatMsg.isPinned ? 'Bỏ ghim tin nhắn' : 'Ghim tin nhắn'}
                                </button>
                              </>
                            )}
                            {!isMyMessage && (
                              <>
                                <button
                                  onClick={() => {
                                    setReplyTo(chatMsg);
                                    setShowMenuFor(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  Trả lời
                                </button>
                                <hr className="my-1" />
                                <button
                                  onClick={() => {
                                    if (chatMsg.isPinned) {
                                      handleUnpinMessage(chatMsg.id);
                                    } else {
                                      handlePinMessage(chatMsg.id);
                                    }
                                    setShowMenuFor(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                  {chatMsg.isPinned ? 'Bỏ ghim tin nhắn' : 'Ghim tin nhắn'}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Avatar cho tin nhắn của mình */}
                {isMyMessage && (
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <Image
                        src={
                          user?.img
                            ? `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}${user.img}`
                            : "/avatar.png"
                        }
                        alt={user?.username || 'You'}
                        width={40}
                        height={40}
                        className="rounded-full ring-2 ring-blue-100 shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
            
            elements.push(messageElement);
            return elements;
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply preview */}
        {replyTo && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-blue-600 font-medium mb-1">
                  Trả lời {replyTo.user.username}
                </p>
                <p className="text-xs text-blue-500 truncate">
                  {replyTo.content.length > 100 
                    ? replyTo.content.substring(0, 100) + '...' 
                    : replyTo.content
                  }
                </p>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="ml-2 p-1 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Khung nhập liệu */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Nhập tin nhắn..."
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={!user || isSubmitting}
              />
            </div>
            <button
              type="submit"
              className={`p-3 rounded-full transition-all duration-200 ${
                !user || isSubmitting || !newMessage.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
              disabled={!user || isSubmitting || !newMessage.trim()}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Cột phụ (All members) */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Header thành viên */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 text-lg mb-1">
            Thành viên
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {onlineMembers.length} đang hoạt động
            </span>
            <span>•</span>
            <span>{classMembers.length} tổng cộng</span>
          </div>
        </div>
        
        {/* Danh sách thành viên */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <div className="space-y-2">
            {classMembers.map((member) => {
              const isOnline = onlineMembers.some((om) => String(om.id) === String(member.id));
              return (
                <div key={member.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  isOnline ? 'bg-green-50 border border-green-100' : 'bg-gray-50 hover:bg-gray-100'
                }`}>
                  <div className="relative flex-shrink-0">
                    <Image
                      src={
                        member.img
                          ? `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}${member.img}`
                          : "/avatar.png"
                      }
                      alt={member.username}
                      width={44}
                      height={44}
                      className="rounded-full ring-2 ring-white shadow-sm"
                    />
                    {/* Status indicator */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                        isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    ></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">
                      {member.username}
                    </p>
                    {isOnline ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-xs text-green-600 font-medium">Đang hoạt động</p>
                      </div>
                    ) : member.lastSeen ? (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatLastSeen(member.lastSeen)}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-0.5">Ngoại tuyến</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function để format thời gian last seen
function formatLastSeen(lastSeen: Date): string {
  const now = new Date();
  const diff = now.getTime() - lastSeen.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Vừa mới offline";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;

  return lastSeen.toLocaleDateString("vi-VN");
}
