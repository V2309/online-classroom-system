"use client";
import React, { createContext, useContext, useEffect, ReactNode } from "react";
import type { UserProfile } from "@/types/auth";
import { useUserStore } from "@/stores/useUserStore";

interface UserContextType {
  user: UserProfile | null;
  error: string | null;
  loading: boolean;
  refetchUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { user, error, loading, fetchUser, refetchUser } = useUserStore();

  useEffect(() => {
    fetchUser();

    // Lắng nghe sự kiện login/update profile để refetch
    const handleLogin = () => {
      fetchUser();
    };

    window.addEventListener("user-logged-in", handleLogin);
    window.addEventListener("profile-updated", handleLogin);
    return () => {
      window.removeEventListener("user-logged-in", handleLogin);
      window.removeEventListener("profile-updated", handleLogin);
    };
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ user, error, loading, refetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    // Fallback directly to Zustand store if called outside provider
    const { user, error, loading, refetchUser } = useUserStore();
    return { user, error, loading, refetchUser };
  }
  return context;
}