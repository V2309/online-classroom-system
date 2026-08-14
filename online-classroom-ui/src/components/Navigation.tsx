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
      // Redirect về trang chủ sau khi logout (dù thành công hay lỗi)
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
    <nav className="relative flex items-center justify-between p-4 h-[70px] bg-ds-surface-container-lowest border-b border-ds-outline-variant">
      {/* Left side: Logo & Site Name */}
      <div className="flex items-center space-x-2">
        <svg
          className="w-8 h-8 text-ds-primary"
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
        <span className="text-xl font-bold text-ds-on-surface">DocuS</span>
      </div>

      {/* Center: Desktop Menu */}
      <div className="hidden md:flex items-center space-x-8 text-sm">
        {itemsForRole.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`transition-colors ${
              pathname === item.href
                ? "text-ds-primary font-bold underline underline-offset-8"
                : "text-ds-on-surface hover:text-ds-primary"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Right side: Desktop Actions */}
      <div className="hidden md:flex items-center space-x-4">
        <Link
          href="#"
          className="px-4 py-2 bg-ds-primary text-ds-on-primary rounded-md hover:bg-ds-primary-container transition-colors"
        >
          Hỏi đáp
        </Link>
        <Link
          href="/sign-in"
          className="px-4 py-2 text-ds-on-surface hover:text-ds-primary transition-colors"
        >
          Hỏi đáp cùng Classroom
        </Link>
        <div className="relative cursor-pointer">
          <span className="text-lg">
            <Notification />
          </span>
        </div>
        <div className="relative" ref={menuRef}>
          <div
            className="flex flex-col items-center justify-center p-2 cursor-pointer rounded-full hover:bg-ds-surface-container"
            onClick={() => setOpenMenu((prev) => !prev)}
          >
            <Image
              path={user?.img || "/avatar.png"}
              alt="Avatar"
              w={40}
              h={40}
              className="rounded-full"
            />
            <span className="text-xs font-medium mt-1 text-ds-on-surface-variant">
              {user?.username as string}
            </span>
          </div>
          {openMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-ds-surface-container-lowest rounded-lg shadow-md border border-ds-outline-variant z-50 transform transition-all duration-300 ease-in-out">
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-ds-on-surface hover:bg-ds-surface-container transition-colors"
                onClick={() => setOpenMenu(false)}
              >
                Hồ sơ cá nhân
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm text-ds-on-surface hover:bg-ds-surface-container transition-colors"
                onClick={() => setOpenMenu(false)}
              >
                Cài đặt
              </Link>
              <button
                className="block w-full text-left px-4 py-2 text-sm text-ds-error hover:bg-ds-error-container transition-colors"
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
          className="p-2 text-ds-on-surface hover:text-ds-primary focus:outline-none"
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
        className={`fixed top-0 left-0 w-full h-full bg-ds-surface-container-lowest transition-transform duration-300 ease-in-out transform ${
          openMenu ? "translate-x-0" : "-translate-x-full"
        } md:hidden z-40 p-4 pt-10`}
      >
        <div className="flex flex-col h-full">
          {/* Nút đóng menu */}
          <div className="flex justify-end p-4">
            <button
              onClick={() => setOpenMenu(false)}
              className="p-2 text-ds-on-surface hover:text-ds-error focus:outline-none"
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
            <div className="flex items-center space-x-4 w-full p-2 bg-ds-surface-container-low rounded-lg">
              <Image
                path={user?.img || "/avatar.png"}
                alt="Avatar"
                w={50}
                h={50}
                className="rounded-full"
              />
              <span className="text-lg font-bold text-ds-on-surface">
                {user?.username as string}
              </span>
            </div>

            {/* User Dropdown inside mobile menu */}
            <div className="w-full">
              <Link
                href={`/profile`}
                className="block px-4 py-2 text-sm text-ds-on-surface hover:bg-ds-surface-container w-full text-left transition-colors"
                onClick={() => setOpenMenu(false)}
              >
                Hồ sơ cá nhân
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm text-ds-on-surface hover:bg-ds-surface-container w-full text-left transition-colors"
                onClick={() => setOpenMenu(false)}
              >
                Cài đặt
              </Link>
              <button
                className="block w-full text-left px-4 py-2 text-sm text-ds-error hover:bg-ds-error-container transition-colors"
                onClick={() => {
                  handleLogout();
                  setOpenMenu(false);
                }}
              >
                Đăng xuất
              </button>
            </div>

            <div className="border-t border-ds-outline-variant w-full my-4" />

            {/* Main Navigation Links */}
            {itemsForRole.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block w-full px-4 py-2 text-lg font-medium transition-colors ${
                  pathname === item.href
                    ? "text-ds-primary font-bold"
                    : "text-ds-on-surface hover:text-ds-primary"
                }`}
                onClick={() => setOpenMenu(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="border-t border-ds-outline-variant w-full my-4" />

            <Link
              href="#"
              className="block w-full px-4 py-2 bg-ds-primary text-ds-on-primary rounded-md text-center hover:bg-ds-primary-container transition-colors"
              onClick={() => setOpenMenu(false)}
            >
              Hỏi đáp
            </Link>
            <Link
              href="/sign-in"
              className="block w-full px-4 py-2 text-ds-on-surface text-center hover:text-ds-primary transition-colors"
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