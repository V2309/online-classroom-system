"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import { Copy, Check, Settings, Sparkles, GraduationCap, Users } from "lucide-react";

interface ClassBannerProps {
  classInfo: {
    id: number;
    name: string;
    class_code?: string;
    img?: string | null;
    grade?: { level: string } | null;
    teacher?: { username: string; img?: string | null } | null;
    user?: { username: string; img?: string | null } | null;
    _count?: { students: number };
  };
  classCode: string;
  isTeacher?: boolean;
}

export default function ClassBanner({
  classInfo,
  classCode,
  isTeacher,
}: ClassBannerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classCode);
    setCopied(true);
    toast.success(`Đã sao chép mã lớp: ${classCode}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const teacherName =
    classInfo.teacher?.username || classInfo.user?.username || "Giáo viên";

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-sm border border-border bg-primary text-primary-foreground min-h-[160px] sm:min-h-[190px] p-6 sm:p-8 flex flex-col justify-between transition-all">
      {/* Background Image / Overlay */}
      {classInfo.img ? (
        <>
          <Image
            src={classInfo.img}
            alt={classInfo.name}
            fill
            unoptimized
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </>
      ) : (
        <>
          {/* Decorative glowing blobs */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        </>
      )}

      {/* Top Bar inside Banner */}
      <div className="relative z-10 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {classInfo.grade?.level && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white shadow-2xs">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Khối {classInfo.grade.level}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/15 backdrop-blur-md text-white/90">
            Giáo viên: <b>{teacherName}</b>
          </span>
        </div>

        {/* Action Button: Edit Class (For Teacher) */}
        {isTeacher && (
          <Link
            href={`/class/${classCode}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="Cài đặt lớp học"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Cài đặt lớp</span>
          </Link>
        )}
      </div>

      {/* Bottom Info inside Banner */}
      <div className="relative z-10 pt-6 sm:pt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-white tracking-tight drop-shadow-xs">
            {classInfo.name}
          </h1>
          <p className="text-xs sm:text-sm text-white/80 mt-1">
            Không gian học tập, trao đổi bài giảng và bài tập trực tuyến
          </p>
        </div>

        {/* Copy Class Code Capsule */}
        <button
          type="button"
          onClick={handleCopyCode}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs sm:text-sm font-semibold border border-white/30 transition-all shadow-2xs active:scale-95 cursor-pointer self-start sm:self-auto"
          title="Nhấp để sao chép mã lớp"
        >
          <span className="text-white/80">Mã lớp:</span>
          <span className="font-mono font-bold tracking-wider">{classCode}</span>
          {copied ? (
            <Check className="w-4 h-4 text-emerald-300" />
          ) : (
            <Copy className="w-4 h-4 text-white/80" />
          )}
        </button>
      </div>
    </div>
  );
}
