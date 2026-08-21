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
            className="flex items-center gap-2.5 p-1.5 pr-3 cursor-pointer rounded-full bg-card hover:bg-muted transition-all border border-border shadow-2xs group"
            onClick={() => setOpenMenu((prev) => !prev)}
          >
            {/* Avatar with dynamic Plan Ring & Corner Badge */}
            <div className="relative flex-shrink-0">
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden aspect-square transition-all ${
                  user?.plan === "PREMIUM"
                    ? "ring-2 ring-amber-500 shadow-amber-500/20 shadow-md"
                    : user?.plan === "PRO"
                    ? "ring-2 ring-blue-500 shadow-blue-500/20 shadow-md"
                    : "ring-2 ring-primary/20"
                }`}
              >
                <Image
                  path={user?.img || "/avatar.png"}
                  alt="Avatar"
                  w={80}
                  h={80}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>

              {/* Corner mini badge on avatar */}
              {user?.plan === "PREMIUM" ? (
                <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full border-2 border-background shadow-xs">
                  VIP
                </span>
              ) : user?.plan === "PRO" ? (
                <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full border-2 border-background shadow-xs">
                  PRO
                </span>
              ) : null}
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-foreground max-w-[120px] truncate">
                {user?.username as string}
              </span>

              {/* Plan pill badge next to username */}
              {user?.plan === "PREMIUM" ? (
                <span className="text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                  👑 VIP
                </span>
              ) : user?.plan === "PRO" ? (
                <span className="text-[10px] font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                  💎 PRO
                </span>
              ) : (
                <span className="text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                  FREE
                </span>
              )}
            </div>

            <svg
              className="w-3.5 h-3.5 text-muted-foreground hidden md:inline group-hover:translate-y-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {openMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-card rounded-2xl shadow-xl border border-border py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-foreground">
              <div className="px-4 py-3 border-b border-border space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground truncate">{user?.username}</p>
                  {user?.plan === "PREMIUM" ? (
                    <span className="text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      👑 PREMIUM
                    </span>
                  ) : user?.plan === "PRO" ? (
                    <span className="text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                      💎 PRO
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      FREE
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {role === "teacher" ? "Giáo viên" : "Học sinh"}
                </p>
                {user?.planExpiresAt && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Hạn gói: {new Date(user.planExpiresAt).toLocaleDateString("vi-VN")}
                  </p>
                )}
              </div>
              <Link
                href="/profile"
                className="block px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                onClick={() => setOpenMenu(false)}
              >
                Hồ sơ cá nhân
              </Link>
              <Link
                href="/pricing"
                className="flex items-center justify-between px-4 py-2.5 text-sm text-primary hover:bg-primary/10 transition-colors font-semibold"
                onClick={() => setOpenMenu(false)}
              >
                <span>{user?.plan && user.plan !== "FREE" ? "⭐ Quản lý / Gia hạn gói" : "💎 Nâng cấp tài khoản"}</span>
                <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">
                  {user?.plan === "PREMIUM" ? "VIP" : "PRO"}
                </span>
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
                className="block w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors font-medium cursor-pointer"
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
