"use client";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

export const menuItems = [
  {
    label: "Tổng quan",
    href: "/student/overview",
    icon: <Image src="/home1.png" alt="Overview" width={24} height={24} />,
  },
  {
    label: "Lớp học",
    href: "/student/class",
    icon: <Image src="/class.png" alt="Classes" width={24} height={24} />,
  },
  {
    label: "Lịch học",
    href: "/student/schedule",
    icon: <Image src="/data.png" alt="Schedule" width={24} height={24} />,
  },
  {
    label: "Kết quả",
    href: "/student/results",
    icon: <Image src="/results.png" alt="Results" width={24} height={24} />,
  },
  {
    label: "Thông báo",
    href: "/student/notifications",
    icon: <Image src="/moti.png" alt="Notifications" width={24} height={24} />,
  },
  {
    label: "Chat UniAi",
    href: "/student/chat",
    icon: <Image src="/chat.png" alt="Chat UniAi" width={24} height={24} />,
    isNew: true, // ✅ Thêm flag để hiển thị badge "New"
  },
];

export const MenuList = () => {
  const pathname = usePathname();

  return (
    <>
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-gray-500 transition-colors group relative
              ${isActive ? "bg-gray-200 text-primary" : "hover:bg-gray-200 hover:text-blue-500"}
            `}
          >
            <span className={`text-primary group-hover:text-white ${isActive ? "text-white" : ""}`}>
              {item.icon}
            </span>

            <span className="hidden lg:inline font-semibold text-base tracking-wide font-sans relative">
              {item.label}
              {item.isNew && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                  New
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </>
  );
};

export default MenuList;
