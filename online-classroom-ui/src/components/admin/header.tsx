"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Users,
  Menu,
  Settings,
  CircleUser,
  LogOut, // Import thêm icon Logout cho đẹp
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";


// 1. Import action logout
import { logoutAction } from "@/lib/actions/auth.action";

// 2. Định nghĩa kiểu dữ liệu User nhận vào
interface HeaderProps {
  user?: {
    username: string;
    email?: string | null; // Email có thể null trong schema của bạn
    img?: string | null;
    role?: string;
  } | null;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/user", label: "Users", icon: Users },
];

// 3. Nhận prop user
export function Header({ user }: HeaderProps) {
  
  // Hàm xử lý logout
  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 bg-white" >
      {/* --- Mobile Sidebar (Giữ nguyên code cũ của bạn) --- */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
             {/* ... Code menu mobile của bạn giữ nguyên ... */}
             <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-4">
               <Settings className="h-6 w-6" />
               <span className="">Modern Dash</span>
             </Link>
             {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* --- Thanh Search (Placeholder để giữ khoảng cách) --- */}
      <div className="w-full flex-1"></div>

      {/* --- User Dropdown (Đã cập nhật) --- */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full overflow-hidden">
            {/* Nếu có ảnh thì hiện ảnh, không thì hiện icon */}
            {user?.img ? (
               // Lưu ý: Dùng thẻ img thường hoặc next/image tùy setup của bạn
               <Image src={user.img} alt={user.username} className="h-full w-full object-cover" />
            ) : (
               <CircleUser className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white">
          {/* Hiển thị tên và email */}
          <DropdownMenuLabel className="font-normal ">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.username || "User"}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || user?.role || "No email"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          
          {/* Nút Logout gọi Server Action */}
          <DropdownMenuItem 
            className="text-red-600 cursor-pointer focus:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}