"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  Compass,
  Video,
  Bot,
  ArrowUpCircle,
} from "lucide-react";

export type Role = "teacher" | "student";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  visible: Role[];
}

export const sidebarNavItems: NavItem[] = [
  // Student items
  {
    label: "Tổng quan",
    href: "/overview",
    icon: LayoutDashboard,
    visible: ["student"],
  },
  {
    label: "Lớp học",
    href: "/class",
    icon: GraduationCap,
    visible: ["student", "teacher"],
  },
  {
    label: "Lịch học",
    href: "/schedule",
    icon: Calendar,
    visible: ["student", "teacher"],
  },
  {
    label: "Phòng họp",
    href: "/room",
    icon: Video,
    visible: ["teacher"],
  },
  {
    label: "Chat bot",
    href: "/chat",
    icon: Bot,
    visible: ["student"],
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const role = user?.role as Role | undefined;

  const filteredItems = role
    ? sidebarNavItems.filter((item) => item.visible.includes(role))
    : sidebarNavItems;

  return (
    <aside className="w-60 lg:w-64 h-full bg-card border-r border-border flex flex-col justify-between p-4 sm:p-5 flex-shrink-0 select-none text-foreground">
      {/* Top section: Logo & Navigation */}
      <div className="flex flex-col space-y-7">
        {/* Logo Brand DocuS */}
        <Link href="/" className="flex items-center gap-2.5 group px-2">
          <div className="text-primary flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
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
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">DocuS</span>
        </Link>

        {/* Navigation links */}
        <nav className="flex flex-col space-y-1.5">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && item.href !== "/overview" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-accent text-primary shadow-2xs font-bold"
                    : "text-secondary hover:text-foreground hover:bg-muted/70"
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom section: Upgrade Plan Button */}
      <div className="pt-4 border-t border-border/60">
        <Link
          href="/pricing"
          className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm rounded-full transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 group"
        >
          <ArrowUpCircle className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span>Upgrade Plan</span>
        </Link>
      </div>
    </aside>

  );
}
