"use client";

import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { authService } from "@/services/auth.service";
import Image from "@/components/Image";
import Notification from "./Notification";

export default function AppHeader() {
  const { user } = useUser();
  const role = user?.role as "teacher" | "student" | undefined;

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      window.location.href = "/";
    }
  };

  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(false);
      }
    }
    if (openMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenu]);

  return (
    <header className="h-[70px] w-full bg-background border-b border-border px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-30 select-none text-foreground transition-colors">
      {/* Left area: spacer or breadcrumbs */}
      <div className="flex items-center">
        {/* Placeholder if needed */}
      </div>

      {/* Right area: Desktop Actions */}
      <div className="flex items-center space-x-3.5 sm:space-x-4">
        <Link
          href="#"
          className="px-4 py-2 bg-primary text-primary-foreground text-xs sm:text-sm font-semibold rounded-full hover:bg-primary-hover transition-colors shadow-2xs"
        >
          Hỏi đáp
        </Link>
        <Link
          href="/sign-in"
          className="hidden sm:inline-block px-3 py-2 text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          Hỏi đáp cùng Classroom
        </Link>
        <div className="relative cursor-pointer p-1.5 rounded-full hover:bg-card transition-colors">
          <span className="text-lg">
            <Notification />
          </span>
        </div>

        {/* User Profile Capsule */}
        <div className="relative" ref={menuRef}>
          <div
            className="flex items-center gap-2.5 p-1.5 px-2.5 cursor-pointer rounded-full bg-card hover:bg-muted transition-colors border border-border shadow-2xs"
            onClick={() => setOpenMenu((prev) => !prev)}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden flex-shrink-0 aspect-square ring-2 ring-primary/20 shadow-2xs">
              <Image
                path={user?.img || "/avatar.png"}
                alt="Avatar"
                w={80}
                h={80}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-foreground max-w-[120px] truncate hidden md:inline">
              {user?.username as string}
            </span>
            <svg
              className="w-3.5 h-3.5 text-muted-foreground hidden md:inline"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {openMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-card rounded-2xl shadow-xl border border-border py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-foreground">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-bold text-foreground truncate">{user?.username}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {role === "teacher" ? "Giáo viên" : "Học sinh"}
                </p>
              </div>
              <Link
                href="/profile"
                className="block px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                onClick={() => setOpenMenu(false)}
              >
                Hồ sơ cá nhân
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                onClick={() => setOpenMenu(false)}
              >
                Cài đặt
              </Link>
              <div className="border-t border-border my-1" />
              <button
                className="block w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors font-medium"
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
