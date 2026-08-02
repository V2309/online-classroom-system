
// menu-class.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { RefAttributes, useState , ForwardRefExoticComponent } from "react";
import LeaveClassDialog from "./LeaveClassDialog";
import { toast } from 'react-toastify'; 
import QRCodeModal from './modals/QRCodeModal'; // Import Modal QR Code

// Import icon từ lucide-react
import {
  LayoutDashboard,
  Calendar,
  Users,
  BookCopy,
  BarChart3,
  Clapperboard,
  Files,
  LogOut,
  Settings,
  UserCircle, // Icon fallback
  Copy, 
  QrCode,
  HeartOff, 
  Group,
  UserCheck, // Thêm icon cho groups
  LucideProps,
  Presentation,
} from "lucide-react";
import { group } from "console";

interface MenuClassProps {
  classDetail: {
    id: number | string;
    name: string;
    class_code: string | null;
    capacity: number;
    supervisor?: { 
      username?: string;
      img?: string | null; 
    } | null;
    students: { id: string; username?: string }[];
    grade?: { level?: string } | null;
  };
  role: "teacher" | "student";
  pendingRequestCount: number ;
}

type IconComponent = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;

type MenuLink = {
  href: string;
  label: string;
  icon: IconComponent;
  badge: number; // Quan trọng: Khai báo badge là 'number'
};

// Map icon tới component
const menuIcons = {
  newsfeed: LayoutDashboard,
  schedule: Calendar,
  members: Users,
  homework: BookCopy,
  scoretable: BarChart3,
  lectures: Clapperboard,
  documents: Files,
  groupchat: Group,
  groups: UserCheck, // Thêm icon cho groups
  whiteboard: Presentation, // 
};

export default function MenuClass({ classDetail, role, pendingRequestCount }: MenuClassProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false); // State cho QR Modal

  const class_code = classDetail.class_code;

  // Tạo link tham gia (chỉ chạy ở client)
  const joinLink = (class_code && typeof window !== 'undefined') 
    ? `${window.location.origin}/join/${class_code}` 
    : '';

  const links: MenuLink[] = [
    { href: `/class/${class_code}/newsfeed`, label: "Bảng tin", icon: menuIcons.newsfeed, badge: 0 },
{ href: `/class/${class_code}/whiteboard`, label: "Bảng trắng", icon: menuIcons.whiteboard, badge: 0 },
    { href: `/class/${class_code}/schedule`, label: "Lịch học", icon: menuIcons.schedule, badge: 0 },
    { 
      href: `/class/${class_code}/member`, 
      label: "Thành viên", 
      icon: menuIcons.members, 
      badge: role === 'teacher' ? pendingRequestCount : 0 
    },
    { href: `/class/${class_code}/groups`, label: "Nhóm lớp", icon: menuIcons.groups, badge: 0 }, 
    { href: `/class/${class_code}/groupchat`, label: "Nhóm chat", icon: menuIcons.groupchat, badge: 0 },
    { href: `/class/${class_code}/homework/list`, label: "Bài tập", icon: menuIcons.homework, badge: 0 },
    { href: `/class/${class_code}/scoretable`, label: "Bảng điểm", icon: menuIcons.scoretable, badge: 0 },
    { href: `/class/${class_code}/video`, label: "Bài giảng", icon: menuIcons.lectures, badge: 0 },
    { href: `/class/${class_code}/documents`, label: "Tài liệu", icon: menuIcons.documents, badge: 0 },
  ];
  
  const handleCopy = () => {
    if (!joinLink) return;
    navigator.clipboard.writeText(joinLink);
    toast.success("Đã sao chép link tham gia!");
  }

  return (
    // SỬA LỖI LAYOUT: Thêm padding (p-2 md:p-4) VÀ h-full
    <div className="flex flex-col h-full p-2 md:p-4">
      {/* Thông tin lớp học (không co lại) */}
      <div className="mb-6 flex-shrink-0">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate" title={classDetail.name}>
          {classDetail.name}
        </h2>
        
        {/* Ẩn thông tin phụ trên mobile */}
        <div className="hidden md:block">
          <p className="text-sm md:text-sm text-gray-500 mt-1">
            Mã lớp: {classDetail.class_code}
          </p>
          <p className="text-xs md:text-sm text-gray-500 mt-2">Giáo viên: {classDetail.supervisor?.username || "Chưa phân công"}</p>
     
        </div>

        {/* SỬA LỖI CSS: Chia sẻ lớp học */}
        <div className="mt-4">
          <h3 className="hidden md:block text-sm font-semibold mb-1 text-gray-700">
            Chia sẻ lớp học
          </h3>
          
          {/* Giao diện Desktop (md:block) */}
          <div className="relative w-full hidden md:block">
            <input
              type="text"
              readOnly 
              value={joinLink}
              // Thêm pr-24 (padding-right) để text không bị đè
              className="w-full p-2 pr-24 text-sm border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Đang tải link..."
            />
            {/* Container cho các nút */}
            <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
              {/* Nút Copy */}
              <button
                onClick={handleCopy}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                title="Sao chép link tham gia"
              > 
                <Copy className="w-5 h-5" />
              </button>
              
              {/* Nút mở QR Code */}
              <button
                onClick={() => setShowQRModal(true)}
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Hiển thị mã QR"
              > 
                <QrCode className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Giao diện Mobile (md:hidden) - Chỉ hiện 2 nút */}
          <div className="flex items-center gap-2 mt-1 md:hidden">
            {/* Nút Copy */}
            <button
              onClick={handleCopy}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              title="Sao chép link tham gia"
            > 
              <Copy className="w-5 h-5" />
            </button>
            
            {/* Nút mở QR Code */}
            <button
              onClick={() => setShowQRModal(true)}
              className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Hiển thị mã QR"
            > 
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Danh mục (co giãn và cuộn) */}
      {/* SỬA LỖI LAYOUT: Thêm flex-grow và custom scroll */}
      <nav className="flex flex-col scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const IconComponent = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              title={link.label} // Tooltip cho mobile
              className={` relative flex items-center gap-3 p-2 md:p-3 justify-center md:justify-start rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-bold"
                  : "text-gray-600 hover:text-blue-700 hover:bg-gray-50"
              }`}
            >
              <IconComponent 
                className={`w-6 h-6 flex-shrink-0 ${
                  isActive ? "text-blue-700" : "text-gray-500 group-hover:text-blue-700"
                }`} 
              />
              {/* Responsive: Ẩn chữ trên mobile */}
              <span className="hidden md:inline text-sm md:text-sm">{link.label}</span>
               {/* 5. LOGIC HIỂN THỊ CHẤM ĐỎ */}
              {link.badge > 0 && (
                <span className="absolute top-1 right-1 md:top-1/2 md:-translate-y-1/2 md:right-3 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {link.badge > 9 ? '9+' : link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Nút Cài đặt / Rời lớp (không co lại) */}
      <div className="mt-2 pt-1 border-t border-gray-200 flex-shrink-0">
        {role === "student" ? (
          <button 
            onClick={() => setShowLeaveDialog(true)}
            title="Rời khỏi lớp học"
            className="flex items-center gap-3 p-2 md:p-3 w-full text-sm md:text-base text-red-500 hover:bg-red-50 rounded-lg transition-colors justify-center md:justify-start"
          >
            <LogOut className="w-6 h-6" />
            <span className="hidden md:inline">Rời khỏi lớp học</span>
          </button>
        ) : (
          <Link 
            href={`/class/${class_code}/edit`}
            title="Cài đặt lớp"
            className="flex items-center gap-3 p-2 md:p-3 w-full text-sm md:text-base text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors justify-center md:justify-start"
          >
            <Settings className="w-6 h-6" />
            <span className="hidden md:inline">Cài đặt lớp</span>
          </Link>
        )}
      </div>

      {/* Leave Class Dialog (Giữ nguyên) */}
      {role === "student" && (
        <LeaveClassDialog
          isOpen={showLeaveDialog}
          onClose={() => setShowLeaveDialog(false)}
          classData={{
            id: Number(classDetail.id),
            name: classDetail.name,
            class_code: classDetail.class_code
          }}
          onSuccess={() => {
            router.push('/class'); 
          }}
        />
      )}
      
      {/* THÊM: Component Modal QR (chỉ render khi state là true) */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        link={joinLink}
        code={classDetail.class_code}
      />
    </div>
  );
}

