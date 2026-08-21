"use client";

import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { authService } from "@/services/auth.service";
import Image from "@/components/Image";
import Notification from "./Notification";

/* =========================
   Config menu gộp chung file
   ========================= */
export type Role = "teacher" | "student";

export const topNavItems = [
  // Teacher
  { label: "Lớp học", href: "/class", visible: ["teacher"] as Role[] },
  { label: "Lịch học", href: "/schedule", visible: ["teacher"] as Role[] },
  { label: "Phòng họp", href: "/room", visible: ["teacher"] as Role[] },

  // Student
  { label: "Tổng quan", href: "/overview", visible: ["student"] as Role[] },
  { label: "Lớp học", href: "/class", visible: ["student"] as Role[] },
  { label: "Lịch học", href: "/schedule", visible: ["student"] as Role[] },
  { label: "Chat bot", href: "/chat", visible: ["student"] as Role[] },
] as const;

export default function Navigation() {
  const { user } = useUser();
  const role = user?.role as Role | undefined;

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      window.location.href = "/";
    }
  };

  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
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

  const itemsForRole = role
    ? topNavItems.filter((i) => i.visible.includes(role))
    : [];

  return (
    <nav className="relative flex items-center justify-between px-4 sm:px-6 h-[70px] bg-card border-b border-border text-foreground">
      {/* Left side: Logo & Site Name */}
      <div className="flex items-center space-x-2.5">
        <svg
          className="w-8 h-8 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-xl font-bold text-foreground tracking-tight">DocuS</span>
      </div>

      {/* Center: Desktop Menu */}
      <div className="hidden md:flex items-center space-x-8 text-sm">
        {itemsForRole.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`transition-colors ${pathname === item.href
                ? "text-primary font-bold underline underline-offset-8"
                : "text-foreground hover:text-primary"
              }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Right side: Desktop Actions */}
      <div className="hidden md:flex items-center space-x-3.5">
        <Link
          href="#"
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-2xs"
        >
          Hỏi đáp
        </Link>
        <Link
          href="/sign-in"
          className="px-3.5 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          Hỏi đáp cùng Classroom
        </Link>
        <div className="relative cursor-pointer p-1.5 rounded-full hover:bg-muted/70 transition-colors">
          <span className="text-lg">
            <Notification />
          </span>
        </div>

        {/* User Profile Capsule in Nav */}
        <div className="relative" ref={menuRef}>
          <div
            className="flex items-center gap-2.5 p-1.5 pr-3 cursor-pointer rounded-full hover:bg-muted transition-all border border-border select-none group"
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

            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-foreground max-w-[130px] truncate">
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

            <svg className="w-3.5 h-3.5 text-muted-foreground hidden lg:inline group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <p className="text-xs text-muted-foreground truncate">{role === 'teacher' ? 'Giáo viên' : 'Học sinh'}</p>
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

      {/* Mobile Menu Button */}
      <div className="flex items-center md:hidden">
        <button
          onClick={() => setOpenMenu(!openMenu)}
          className="p-2 text-foreground hover:text-primary focus:outline-none"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16m-7 6h7"
            ></path>
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-0 left-0 w-full h-full bg-card transition-transform duration-300 ease-in-out transform ${openMenu ? "translate-x-0" : "-translate-x-full"
          } md:hidden z-40 p-4 pt-10`}
      >
        <div className="flex flex-col h-full">
          {/* Nút đóng menu */}
          <div className="flex justify-end p-4">
            <button
              onClick={() => setOpenMenu(false)}
              className="p-2 text-foreground hover:text-destructive focus:outline-none"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>

          <div className="flex flex-col items-start space-y-4 px-4">
            {/* User Info & Avatar */}
            <div className="flex items-center space-x-4 w-full p-3 bg-muted rounded-2xl border border-border">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 aspect-square ring-2 ring-primary/20 shadow-xs">
                <Image
                  path={user?.img || "/avatar.png"}
                  alt="Avatar"
                  w={96}
                  h={96}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="text-base font-bold text-foreground truncate">
                {user?.username as string}
              </span>
            </div>

            {/* User Dropdown inside mobile menu */}
            <div className="w-full">
              <Link
                href={`/profile`}
                className="block px-4 py-2.5 text-sm text-foreground hover:bg-accent w-full text-left transition-colors rounded-xl font-medium"
                onClick={() => setOpenMenu(false)}
              >
                Hồ sơ cá nhân
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2.5 text-sm text-foreground hover:bg-accent w-full text-left transition-colors rounded-xl font-medium"
                onClick={() => setOpenMenu(false)}
              >
                Cài đặt
              </Link>
              <button
                className="block w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors rounded-xl font-medium"
                onClick={() => {
                  handleLogout();
                  setOpenMenu(false);
                }}
              >
                Đăng xuất
              </button>
            </div>

            <div className="border-t border-border w-full my-3" />

            {/* Main Navigation Links */}
            {itemsForRole.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block w-full px-4 py-2.5 text-base font-semibold transition-colors rounded-xl ${pathname === item.href
                    ? "bg-accent text-primary font-bold"
                    : "text-foreground hover:text-primary hover:bg-muted"
                  }`}
                onClick={() => setOpenMenu(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="border-t border-border w-full my-3" />

            <Link
              href="#"
              className="block w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-center font-semibold hover:bg-primary-hover transition-colors shadow-2xs"
              onClick={() => setOpenMenu(false)}
            >
              Hỏi đáp
            </Link>
            <Link
              href="/sign-in"
              className="block w-full px-4 py-2.5 text-foreground text-center font-medium hover:text-primary transition-colors"
              onClick={() => setOpenMenu(false)}
            >
              Hỏi đáp cùng Classroom
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}