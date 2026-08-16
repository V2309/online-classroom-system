import { create } from 'zustand';
import type { UserProfile } from '@/types/auth';
import { authService } from '@/services/auth.service';

interface UserState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchUser: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  refetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  fetchUser: async () => {
    try {
      set({ loading: true, error: null });
      const profile = await authService.getProfile();
      set({ user: profile, loading: false, error: null });
    } catch (err: any) {
      if (err.response?.status === 401) {
        set({ user: null, loading: false, error: null });
      } else {
        console.error('Error fetching user profile:', err);
        set({
          user: null,
          loading: false,
          error: err.response?.data?.message || 'Không thể tải thông tin người dùng',
        });
      }
    }
  },

  setUser: (user) => set({ user }),

  refetchUser: async () => {
    await get().fetchUser();
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      set({ user: null, error: null });
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },
}));
