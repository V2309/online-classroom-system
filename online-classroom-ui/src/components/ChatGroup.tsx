"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { useUser } from "@/hooks/useUser";
import { useChatStore } from "@/stores/useChatStore";
import { pusherClient } from "@/lib/pusher-client";
import { type Channel, type Members } from "pusher-js";
import { chatService } from "@/services/chat.service";
import { toast } from "react-toastify";
import { globalPresenceManager } from "@/lib/presence-manager";
import Image from "@/components/Image";
import {
  MessageSquare,
  Users,
  Send,
  Pin,
  X,
  Reply,
  MoreVertical,
  Trash2,
  Undo2,
  Sparkles,
  Smile,
} from "lucide-react";

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

// Helper functions for date formatting
const formatDateSeparator = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDate = new Date(date);

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
    return messageDate.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });
  } else {
    return messageDate.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
};

const shouldShowDateSeparator = (
  currentMsg: ChatGroupMessage | SystemMessage,
  prevMsg: ChatGroupMessage | SystemMessage | null
): boolean => {
  if (!prevMsg) return true;
  const currentDate = new Date(currentMsg.createdAt);
  const prevDate = new Date(prevMsg.createdAt);
  return currentDate.toDateString() !== prevDate.toDateString();
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

interface ChatBoxProps {
  classCode: string;
  initialMessages: ChatGroupMessage[];
  allMembers?: ClassMember[];
}

export function ChatBox({
  classCode,
  initialMessages,
  allMembers = [],
}: ChatBoxProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<(ChatGroupMessage | SystemMessage)[]>(initialMessages);
  const [onlineMembers, setOnlineMembers] = useState<Member[]>([]);
  const [classMembers, setClassMembers] = useState<ClassMember[]>(allMembers);
  const [newMessage, setNewMessage] = useState("");
  const channelRef = useRef<Channel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastSentRef = useRef<{ content: string; timestamp: number } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatGroupMessage | null>(null);
  const [showMenuFor, setShowMenuFor] = useState<string | null>(null);
  const [showMembersMobile, setShowMembersMobile] = useState(false);

  // Reset unread counts khi mở màn hình chat này
  useEffect(() => {
    if (classCode) {
      useChatStore.getState().setActiveChat(Number(classCode) || null);
      if (Number(classCode)) {
        useChatStore.getState().resetUnread(Number(classCode));
      }
    }
    return () => {
      useChatStore.getState().setActiveChat(null);
    };
  }, [classCode]);

  // Cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    if (!user || !classCode) return;

    const setupChannelListeners = async () => {
      try {
        let channel = globalPresenceManager.getChannel(classCode);
        if (!channel) {
          channel = await globalPresenceManager.subscribeToClass(classCode);
        }
        if (!channel) return;
        channelRef.current = channel;

        const currentMembers = globalPresenceManager.getCurrentMembers(classCode);
        if (currentMembers.length > 0) {
          setOnlineMembers(currentMembers);
          setClassMembers((prev) =>
            prev.map((m) => ({
              ...m,
              isOnline: currentMembers.some((om) => String(om.id) === String(m.id)),
            }))
          );
        } else {
          setTimeout(() => {
            const retryMembers = globalPresenceManager.getCurrentMembers(classCode);
            if (retryMembers.length > 0) {
              setOnlineMembers(retryMembers);
              setClassMembers((prev) =>
                prev.map((m) => ({
                  ...m,
                  isOnline: retryMembers.some((om) => String(om.id) === String(m.id)),
                }))
              );
            }
          }, 500);
        }

        channel.bind("new-message", (data: ChatGroupMessage) => {
          setMessages((prev) => {
            if (prev.find((msg) => msg.id === data.id)) return prev;
            if (data.user.id === user?.id) {
              const withoutOptimistic = prev.filter((msg) => {
                if (msg.id.startsWith("temp-") && "user" in msg) {
                  const chatMsg = msg as ChatGroupMessage;
                  return !(chatMsg.user.id === data.user.id && chatMsg.content === data.content);
                }
                return true;
              });
              return [...withoutOptimistic, data];
            }
            return [...prev, data];
          });
        });

        channel.bind("message-deleted", (data: { messageId: string; userId: string }) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
        });

        channel.bind("message-recalled", (data: { messageId: string; content: string; userId: string }) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === data.messageId ? { ...msg, content: data.content } : msg))
          );
        });

        channel.bind("message-pinned", (data: { messageId: string; pinnedAt: string; userId: string }) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === data.messageId ? { ...msg, isPinned: true, pinnedAt: data.pinnedAt } : msg))
          );
        });

        channel.bind("message-unpinned", (data: { messageId: string; userId: string }) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === data.messageId ? { ...msg, isPinned: false, pinnedAt: undefined } : msg))
          );
        });

        channel.bind("pusher:subscription_succeeded", (members: Members) => {
          const memberArray: Member[] = [];
          members.each((member: Member) => memberArray.push(member));
          setOnlineMembers(memberArray);
          setClassMembers((prevClass) =>
            prevClass.map((m) => ({
              ...m,
              isOnline: memberArray.some((om) => String(om.id) === String(m.id)),
            }))
          );
        });

        channel.bind("pusher:member_added", (member: Member) => {
          setOnlineMembers((prev) => {
            if (prev.some((m) => String(m.id) === String(member.id))) return prev;
            return [...prev, member];
          });
          setClassMembers((prev) =>
            prev.map((m) => (String(m.id) === String(member.id) ? { ...m, isOnline: true } : m))
          );
        });

        channel.bind("pusher:member_removed", (member: Member) => {
          setOnlineMembers((prev) => prev.filter((m) => String(m.id) !== String(member.id)));
          setClassMembers((prev) =>
            prev.map((m) =>
              String(m.id) === String(member.id) ? { ...m, isOnline: false, lastSeen: new Date() } : m
            )
          );
        });
      } catch (error) {
        console.error("[ChatGroup] Error setting up channel listeners:", error);
      }
    };

    setupChannelListeners();

    return () => {
      if (channelRef.current) {
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

  useEffect(() => {
    const handleClickOutside = () => setShowMenuFor(null);
    if (showMenuFor) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showMenuFor]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isSubmitting) return;

    const now = Date.now();
    if (lastSentRef.current && lastSentRef.current.content === newMessage.trim() && now - lastSentRef.current.timestamp < 2000) {
      return;
    }

    setIsSubmitting(true);
    lastSentRef.current = { content: newMessage.trim(), timestamp: now };

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: ChatGroupMessage = {
      id: optimisticId,
      content: newMessage,
      createdAt: new Date().toISOString(),
      replyTo: replyTo
        ? {
            id: replyTo.id,
            content: replyTo.content,
            user: replyTo.user,
          }
        : undefined,
      user: {
        id: user.id,
        username: user.username,
        img: user.img || null,
      },
    };

    const messageContent = newMessage;
    const replyData = replyTo;

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
    setReplyTo(null);

    try {
      await chatService.sendMessage({
        content: messageContent,
        classCode,
        replyTo: replyData
          ? {
              id: replyData.id,
              content: replyData.content,
              user: replyData.user,
            }
          : undefined,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gửi tin nhắn thất bại");
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId, classCode);
      toast.success("Tin nhắn đã được xóa");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Xóa tin nhắn thất bại");
    }
  };

  const handleRecallMessage = async (messageId: string) => {
    try {
      await chatService.recallMessage(messageId, classCode);
      toast.success("Tin nhắn đã được thu hồi");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Thu hồi tin nhắn thất bại");
    }
  };

  const handlePinMessage = async (messageId: string) => {
    try {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, isPinned: true, pinnedAt: new Date().toISOString() } : msg))
      );
      await chatService.pinMessage(messageId, classCode);
      toast.success("Đã ghim tin nhắn");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ghim tin nhắn thất bại");
    }
  };

  const handleUnpinMessage = async (messageId: string) => {
    try {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, isPinned: false, pinnedAt: undefined } : msg))
      );
      await chatService.unpinMessage(messageId, classCode);
      toast.success("Đã bỏ ghim tin nhắn");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Bỏ ghim tin nhắn thất bại");
    }
  };

  const pinnedList = messages.filter((msg) => !("type" in msg) && (msg as ChatGroupMessage).isPinned);

  return (
    <div className="h-full w-full bg-white rounded-3xl border border-border shadow-sm flex overflow-hidden">
      {/* ── CỘT CHÍNH: KHUNG TRÒ CHUYỆN ── */}
      <div className="flex-1 flex flex-col min-h-0 bg-white">
        {/* HEADER CHAT */}
        <div className="px-5 py-3.5 border-b border-border/80 bg-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-accent text-primary flex items-center justify-center shadow-2xs flex-shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-heading font-bold text-foreground leading-tight">
                Nhóm thảo luận chung
              </h2>
              <p className="text-[11px] text-secondary flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{onlineMembers.length} thành viên đang trực tuyến</span>
              </p>
            </div>
          </div>

          {/* Nút toggle xem thành viên trên mobile */}
          <button
            type="button"
            onClick={() => setShowMembersMobile(!showMembersMobile)}
            className="sm:hidden p-2 rounded-xl bg-card border border-border text-secondary hover:text-foreground"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>

        {/* KHU VỰC TIN NHẮN ĐÃ GHIM */}
        {pinnedList.length > 0 && (
          <div className="bg-amber-50/90 border-b border-amber-200/70 px-4 py-2.5 flex items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Pin className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
              <div className="truncate text-xs text-amber-950 font-medium">
                <span className="font-bold mr-1.5">Tin đã ghim:</span>
                {(pinnedList[0] as ChatGroupMessage).content}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleUnpinMessage((pinnedList[0] as ChatGroupMessage).id)}
              className="text-amber-800 hover:text-amber-950 p-1 rounded-full cursor-pointer"
              title="Bỏ ghim"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* FEED DANH SÁCH TIN NHẮN */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-muted/20 min-h-0 scrollbar-thin">
          {messages.map((msg, index) => {
            const elements = [];
            const prevMsg = index > 0 ? messages[index - 1] : null;

            if (shouldShowDateSeparator(msg, prevMsg)) {
              elements.push(
                <div key={`date-${msg.id}`} className="flex justify-center my-3">
                  <span className="bg-white px-3.5 py-1 text-secondary text-[11px] font-bold rounded-full shadow-2xs border border-border">
                    {formatDateSeparator(new Date(msg.createdAt))}
                  </span>
                </div>
              );
            }

            if ("type" in msg && msg.type === "system") {
              elements.push(
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="bg-card text-muted-foreground text-[11px] px-3.5 py-1 rounded-full border border-border/80 shadow-2xs">
                    {msg.content}
                  </div>
                </div>
              );
              return elements;
            }

            const chatMsg = msg as ChatGroupMessage;
            const isMyMessage = chatMsg.user.id === user?.id;

            const messageElement = (
              <div
                key={chatMsg.id}
                className={`flex gap-2.5 ${isMyMessage ? "justify-end" : "justify-start"}`}
              >
                {!isMyMessage && (
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-border shadow-2xs">
                      <Image
                        path={chatMsg.user.img || "/avatar.png"}
                        alt={chatMsg.user.username}
                        w={64}
                        h={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className={`flex flex-col max-w-[80%] sm:max-w-md ${isMyMessage ? "items-end" : "items-start"}`}>
                  {!isMyMessage && (
                    <span className="text-[11px] font-bold text-secondary mb-1 ml-1">
                      {chatMsg.user.username}
                    </span>
                  )}

                  <div className="relative group flex items-center gap-1.5">
                    {/* BUBBLE CHAT */}
                    <div
                      className={`px-4 py-2.5 rounded-2xl shadow-2xs text-xs sm:text-sm leading-relaxed break-words ${
                        isMyMessage
                          ? "bg-primary text-primary-foreground rounded-tr-xs"
                          : "bg-white text-foreground border border-border rounded-tl-xs"
                      }`}
                    >
                      {chatMsg.replyTo && (
                        <div
                          className={`mb-2 p-2 rounded-xl text-xs border-l-2 ${
                            isMyMessage
                              ? "bg-black/15 border-primary-foreground/50 text-white/90"
                              : "bg-muted/70 border-primary text-secondary"
                          }`}
                        >
                          <p className="font-bold">{chatMsg.replyTo.user.username}</p>
                          <p className="truncate opacity-80 mt-0.5">{chatMsg.replyTo.content}</p>
                        </div>
                      )}

                      <p>{chatMsg.content}</p>

                      <div
                        className={`text-[10px] mt-1 font-medium text-right ${
                          isMyMessage ? "text-primary-foreground/75" : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(new Date(chatMsg.createdAt))}
                      </div>
                    </div>

                    {/* MENU HÀNH ĐỘNG TIN NHẮN */}
                    <div
                      className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${
                        isMyMessage ? "order-first" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setReplyTo(chatMsg)}
                        className="p-1.5 bg-white border border-border rounded-full hover:bg-muted text-secondary hover:text-foreground transition-all shadow-2xs cursor-pointer"
                        title="Trả lời"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenuFor(showMenuFor === chatMsg.id ? null : chatMsg.id);
                          }}
                          className="p-1.5 bg-white border border-border rounded-full hover:bg-muted text-secondary hover:text-foreground transition-all shadow-2xs cursor-pointer"
                          title="Tùy chọn"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {showMenuFor === chatMsg.id && (
                          <div className="absolute top-full mt-1 bg-white border border-border rounded-2xl shadow-lg py-1 z-30 min-w-32 right-0 animate-in fade-in zoom-in-95 duration-150">
                            {isMyMessage && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDeleteMessage(chatMsg.id);
                                    setShowMenuFor(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Xóa</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleRecallMessage(chatMsg.id);
                                    setShowMenuFor(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <Undo2 className="w-3.5 h-3.5" />
                                  <span>Thu hồi</span>
                                </button>
                                <div className="border-t border-border my-1" />
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (chatMsg.isPinned) handleUnpinMessage(chatMsg.id);
                                else handlePinMessage(chatMsg.id);
                                setShowMenuFor(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-primary hover:bg-accent transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <Pin className="w-3.5 h-3.5" />
                              <span>{chatMsg.isPinned ? "Bỏ ghim" : "Ghim"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isMyMessage && (
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-primary/30 shadow-2xs">
                      <Image
                        path={user?.img || "/avatar.png"}
                        alt="You"
                        w={64}
                        h={64}
                        className="w-full h-full object-cover"
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

        {/* KHUNG TRẢ LỜI TIN NHẮN TRƯỚC ĐÓ */}
        {replyTo && (
          <div className="px-4 py-2 bg-accent/60 border-t border-border/80 flex items-center justify-between gap-2 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-primary font-bold">Trả lời {replyTo.user.username}</p>
              <p className="text-[11px] text-secondary truncate">{replyTo.content}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* KHUNG NHẬP LIỆU */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-border/80 flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
            <div className="flex-1 relative bg-card border border-border/80 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-2xs">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nhập tin nhắn thảo luận..."
                className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-xs sm:text-sm font-medium"
                disabled={!user || isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={!user || isSubmitting || !newMessage.trim()}
              className="p-3 bg-primary hover:bg-primary-hover text-primary-foreground rounded-2xl disabled:opacity-40 transition-all shadow-xs cursor-pointer active:scale-95 flex items-center justify-center flex-shrink-0"
              title="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* ── CỘT PHỤ: DANH SÁCH THÀNH VIÊN ── */}
      <div className="w-72 lg:w-80 border-l border-border/80 bg-card/40 flex flex-col min-h-0 hidden sm:flex">
        <div className="p-4 border-b border-border/80 bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-bold text-foreground text-sm">Thành viên lớp</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-secondary mt-1 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              {onlineMembers.length} trực tuyến
            </span>
            <span>•</span>
            <span>{classMembers.length} tổng số</span>
          </div>
        </div>

        {/* Danh sách thành viên cuộn */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 scrollbar-thin">
          {classMembers.map((member) => {
            const isOnline = onlineMembers.some((om) => String(om.id) === String(member.id));
            return (
              <div
                key={member.id}
                className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all border ${
                  isOnline
                    ? "bg-white border-emerald-200/80 shadow-2xs"
                    : "bg-white/60 border-border/50 hover:bg-white"
                }`}
              >
                <div className="relative flex-shrink-0 w-9 h-9">
                  <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-border shadow-2xs">
                    <Image
                      path={member.img || "/avatar.png"}
                      alt={member.username}
                      w={72}
                      h={72}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                      isOnline ? "bg-emerald-500" : "bg-muted-foreground/50"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate text-xs">{member.username}</p>
                  {isOnline ? (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.2">Đang hoạt động</p>
                  ) : member.lastSeen ? (
                    <p className="text-[11px] text-muted-foreground mt-0.2">{formatLastSeen(member.lastSeen)}</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mt-0.2">Ngoại tuyến</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
