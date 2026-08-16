import { create } from 'zustand';
import type { ClassItem } from '@/types/class';
import { classService } from '@/services/class.service';

interface ClassState {
  currentClass: ClassItem | null;
  userRole: 'TEACHER' | 'STUDENT' | null;
  activeTab: string;
  loading: boolean;
  error: string | null;

  // Actions
  fetchClass: (classId: number, currentUserId?: string) => Promise<ClassItem | null>;
  setCurrentClass: (cls: ClassItem | null, role?: 'TEACHER' | 'STUDENT' | null) => void;
  setUserRole: (role: 'TEACHER' | 'STUDENT' | null) => void;
  setActiveTab: (tab: string) => void;
  clearCurrentClass: () => void;
}

export const useClassStore = create<ClassState>((set, get) => ({
  currentClass: null,
  userRole: null,
  activeTab: 'stream',
  loading: false,
  error: null,

  fetchClass: async (classId: number, currentUserId?: string) => {
    // Nếu lớp hiện tại đã load đúng classId thì không fetch lại
    const existing = get().currentClass;
    if (existing && existing.id === classId) {
      return existing;
    }

    try {
      set({ loading: true, error: null });
      const cls = await classService.getClassById(classId);

      let role: 'TEACHER' | 'STUDENT' = 'STUDENT';
      if (currentUserId && (cls.supervisorId === currentUserId || (cls as any).teacherId === currentUserId)) {
        role = 'TEACHER';
      }

      set({
        currentClass: cls,
        userRole: role,
        loading: false,
        error: null,
      });
      return cls;
    } catch (err: any) {
      console.error('Error fetching class details:', err);
      set({
        currentClass: null,
        loading: false,
        error: err.response?.data?.message || 'Không thể tải thông tin lớp học',
      });
      return null;
    }
  },

  setCurrentClass: (cls, role = null) => {
    set((state) => ({
      currentClass: cls,
      userRole: role !== undefined ? role : state.userRole,
    }));
  },

  setUserRole: (role) => set({ userRole: role }),

  setActiveTab: (activeTab) => set({ activeTab }),

  clearCurrentClass: () =>
    set({
      currentClass: null,
      userRole: null,
      activeTab: 'stream',
      loading: false,
      error: null,
    }),
}));
