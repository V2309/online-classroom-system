import { create } from 'zustand';

interface ChatState {
  // unreadCounts: classId -> số tin nhắn chưa đọc
  unreadCounts: Record<number, number>;
  // onlineUsers: classId -> mảng userId đang online
  onlineUsers: Record<number, string[]>;
  activeClassId: number | null;
  activeRecipientId: string | null;

  // Actions
  incrementUnread: (classId: number) => void;
  resetUnread: (classId: number) => void;
  setUnread: (classId: number, count: number) => void;
  setOnlineUsers: (classId: number, userIds: string[]) => void;
  addOnlineUser: (classId: number, userId: string) => void;
  removeOnlineUser: (classId: number, userId: string) => void;
  setActiveChat: (classId: number | null, recipientId?: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  unreadCounts: {},
  onlineUsers: {},
  activeClassId: null,
  activeRecipientId: null,

  incrementUnread: (classId: number) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [classId]: (state.unreadCounts[classId] || 0) + 1,
      },
    })),

  resetUnread: (classId: number) =>
    set((state) => {
      const updated = { ...state.unreadCounts };
      delete updated[classId];
      return { unreadCounts: updated };
    }),

  setUnread: (classId: number, count: number) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [classId]: count,
      },
    })),

  setOnlineUsers: (classId: number, userIds: string[]) =>
    set((state) => ({
      onlineUsers: {
        ...state.onlineUsers,
        [classId]: userIds,
      },
    })),

  addOnlineUser: (classId: number, userId: string) =>
    set((state) => {
      const current = state.onlineUsers[classId] || [];
      if (current.includes(userId)) return state;
      return {
        onlineUsers: {
          ...state.onlineUsers,
          [classId]: [...current, userId],
        },
      };
    }),

  removeOnlineUser: (classId: number, userId: string) =>
    set((state) => {
      const current = state.onlineUsers[classId] || [];
      return {
        onlineUsers: {
          ...state.onlineUsers,
          [classId]: current.filter((id) => id !== userId),
        },
      };
    }),

  setActiveChat: (classId: number | null, recipientId: string | null = null) =>
    set({
      activeClassId: classId,
      activeRecipientId: recipientId,
    }),
}));
