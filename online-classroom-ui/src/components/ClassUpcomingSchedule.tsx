"use client";

import React from "react";
import Link from "next/link";
import { CalendarClock, Video, AlertTriangle, Clock } from "lucide-react";

interface ScheduleItem {
  id: string | number;
  title: string;
  startTime?: string | Date;
  endTime?: string | Date;
  type?: "meeting" | "homework" | "class" | "exam";
  location?: string;
  meetingLink?: string;
}

interface ClassUpcomingScheduleProps {
  classCode: string;
  schedules?: any[];
}

export default function ClassUpcomingSchedule({
  classCode,
  schedules = [],
}: ClassUpcomingScheduleProps) {
  // Chuẩn bị danh sách sự kiện sắp tới
  const now = new Date();

  // Xử lý và lọc các lịch sắp tới từ schedules
  const upcomingEvents: ScheduleItem[] = schedules
    .map((item) => {
      const start = item.startTime ? new Date(item.startTime) : (item.start ? new Date(item.start) : new Date());
      const isMeeting = !!(item.meetingId || item.meetingLink || item.type === "meeting");
      const isHomework = item.type === "homework" || item.isHomework;
      
      return {
        id: item.id,
        title: item.title || item.name || "Lịch học",
        startTime: start,
        type: isMeeting ? ("meeting" as const) : isHomework ? ("homework" as const) : ("class" as const),
        location: item.location || (isMeeting ? "Zoom" : undefined),
        meetingLink: item.meetingLink,
      };
    })
    .filter((event) => {
      // Chỉ lấy sự kiện từ hiện tại hoặc tương lai (hoặc gần đây)
      const eventTime = new Date(event.startTime || "").getTime();
      return eventTime >= now.getTime() - 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => new Date(a.startTime || "").getTime() - new Date(b.startTime || "").getTime())
    .slice(0, 5);

  // Nếu chưa có lịch từ API thì hiển thị dữ liệu mẫu sinh động chuẩn theo thiết kế
  const displayEvents: ScheduleItem[] =
    upcomingEvents.length > 0
      ? upcomingEvents
      : [
          {
            id: 1,
            title: "Thiết kế UI/UX Nâng cao",
            startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
            type: "meeting",
            location: "Zoom",
          },
          {
            id: 2,
            title: "Nộp đồ án Giữa kỳ",
            startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000),
            type: "homework",
          },
        ];

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#ece7de] shadow-sm p-5 sm:p-6 transition-all">
      {/* HEADER */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="text-[#3f6d4d]">
          <CalendarClock className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-[#1f2421] tracking-tight">
          Sắp diễn ra
        </h2>
      </div>

      {/* EVENTS LIST */}
      <div className="space-y-4">
        {displayEvents.map((item) => {
          const date = new Date(item.startTime || now);
          const monthStr = `THG ${date.getMonth() + 1}`;
          const dayStr = date.getDate().toString().padStart(2, "0");
          const timeStr = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
          const isHomework = item.type === "homework";

          return (
            <div
              key={item.id}
              className="flex items-center gap-3.5 group p-1 -m-1 rounded-xl hover:bg-[#faf7f2] transition-colors"
            >
              {/* DATE BADGE */}
              <div
                className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 select-none shadow-2xs ${
                  isHomework
                    ? "bg-[#faedea] text-[#a6382a]"
                    : "bg-[#e5eee8] text-[#2b5938]"
                }`}
              >
                <span
                  className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider leading-tight ${
                    isHomework ? "text-[#b34030]" : "text-[#3d6849]"
                  }`}
                >
                  {monthStr}
                </span>
                <span
                  className={`text-lg sm:text-xl font-extrabold leading-none mt-0.5 ${
                    isHomework ? "text-[#962d20]" : "text-[#234e30]"
                  }`}
                >
                  {dayStr}
                </span>
              </div>

              {/* EVENT INFO */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-[#1f2421] truncate leading-snug group-hover:text-[#3f6d4d] transition-colors">
                  {item.title}
                </h3>

                {isHomework ? (
                  <div className="flex items-center gap-1.5 text-xs text-[#b34030] font-medium mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-[#b34030]" />
                    <span>Hạn cuối: {timeStr}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-[#736c5f] font-normal mt-0.5">
                    <Video className="w-3.5 h-3.5 flex-shrink-0 text-[#736c5f]" />
                    <span>{item.location || "Zoom"} • {timeStr}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER LINK */}
      <div className="mt-5 pt-3.5 border-t border-[#f0ebe3]/80">
        <Link
          href={`/class/${classCode}/schedule`}
          className="text-center text-sm font-semibold text-[#3f6d4d] hover:text-[#2e5239] hover:underline block w-full transition-colors"
        >
          Xem toàn bộ lịch
        </Link>
      </div>
    </div>
  );
}
