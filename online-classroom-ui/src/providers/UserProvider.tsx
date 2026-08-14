"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import type { UserProfile } from "@/types/auth";
import { authService } from "@/services/auth.service";

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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      // getProfile() trả về UserProfile trực tiếp (đã unwrap bởi interceptor)
      const profile = await authService.getProfile();
      setUser(profile);
      setError(null);
    } catch (err: any) {
      // 401 → user chưa đăng nhập (bình thường ở public routes)
      if (err.response?.status === 401) {
        setUser(null);
      } else {
        console.error("Error fetching user:", err);
        setError(err.response?.data?.message || "Failed to load user information");
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const refetchUser = useCallback(() => {
    fetchUser();
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
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}