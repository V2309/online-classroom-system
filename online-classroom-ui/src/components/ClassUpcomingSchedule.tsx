"use client";

import React from "react";
import Link from "next/link";
import { CalendarClock, Video, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";

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
  const now = new Date();

  // Xử lý và lọc các lịch sắp tới từ schedules
  const upcomingEvents: ScheduleItem[] = schedules
    .map((item) => {
      const start = item.startTime
        ? new Date(item.startTime)
        : item.start
        ? new Date(item.start)
        : new Date();
      const isMeeting = !!(item.meetingId || item.meetingLink || item.type === "meeting");
      const isHomework = item.type === "homework" || item.isHomework;

      return {
        id: item.id,
        title: item.title || item.name || "Lịch học",
        startTime: start,
        type: isMeeting
          ? ("meeting" as const)
          : isHomework
          ? ("homework" as const)
          : ("class" as const),
        location: item.location || (isMeeting ? "Phòng học trực tuyến" : undefined),
        meetingLink: item.meetingLink,
      };
    })
    .filter((event) => {
      const eventTime = new Date(event.startTime || "").getTime();
      return eventTime >= now.getTime() - 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => new Date(a.startTime || "").getTime() - new Date(b.startTime || "").getTime())
    .slice(0, 5);

  const displayEvents: ScheduleItem[] =
    upcomingEvents.length > 0
      ? upcomingEvents
      : [
          {
            id: 1,
            title: "Buổi học trực tuyến",
            startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
            type: "meeting",
            location: "Google Meet",
          },
          {
            id: 2,
            title: "Hạn nộp bài tập Tuần này",
            startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000),
            type: "homework",
          },
        ];

  return (
    <div className="bg-white rounded-3xl border border-border shadow-sm p-5 sm:p-6 transition-all hover:shadow-md space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent text-primary flex items-center justify-center shadow-2xs">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-heading font-bold text-foreground">
              Sắp diễn ra
            </h2>
            <p className="text-[11px] text-secondary">Lịch học & Hạn nộp bài</p>
          </div>
        </div>
      </div>

      {/* EVENTS LIST */}
      <div className="space-y-3">
        {displayEvents.map((item) => {
          const date = new Date(item.startTime || now);
          const monthStr = `T${date.getMonth() + 1}`;
          const dayStr = date.getDate().toString().padStart(2, "0");
          const timeStr = `${date.getHours().toString().padStart(2, "0")}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
          const isHomework = item.type === "homework";

          return (
            <div
              key={item.id}
              className="flex items-center gap-3 group p-2 rounded-2xl hover:bg-muted/40 transition-colors border border-border/50"
            >
              {/* DATE BADGE */}
              <div
                className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 select-none shadow-2xs ${
                  isHomework
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-accent text-primary border border-primary/20"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">
                  {monthStr}
                </span>
                <span className="text-base font-extrabold leading-none mt-0.5">
                  {dayStr}
                </span>
              </div>

              {/* EVENT INFO */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-foreground truncate leading-snug group-hover:text-primary transition-colors">
                  {item.title}
                </h3>

                {isHomework ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-700 font-semibold mt-0.5">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>Hạn nộp: {timeStr}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium mt-0.5">
                    <Video className="w-3 h-3 flex-shrink-0 text-primary" />
                    <span>{item.location || "Phòng học"} • {timeStr}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER LINK */}
      <div className="pt-2 border-t border-border/70">
        <Link
          href={`/class/${classCode}/schedule`}
          className="text-center text-xs sm:text-sm font-bold text-primary hover:underline flex items-center justify-center gap-1.5 py-1 transition-colors"
        >
          <span>Xem toàn bộ lịch học</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
