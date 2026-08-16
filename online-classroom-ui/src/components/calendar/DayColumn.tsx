"use client";

import moment from "moment";
import { memo } from "react";
import EventItem from "./EventItem";

// --- ĐỊNH NGHĨA TYPESCRIPT ---
type EventColor = "blue" | "green" | "yellow";

type ScheduleEvent = {
  id: number;
  title: string;
  description?: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  color: EventColor;
  meetingLink?: string | null;
  classInfo?: {
    id: number;
    name: string;
    class_code: string | null;
  };
};

type DayColumnProps = {
  day: moment.Moment;
  isToday: boolean;
  events: ScheduleEvent[];
  onAdd: () => void;
  onEdit?: (event: ScheduleEvent) => void;
  onDelete?: (event: ScheduleEvent) => void;
  role?: string;
};

const DayColumn = ({ day, isToday, events, onAdd, onEdit, onDelete, role }: DayColumnProps) => {
  return (
    <div className="flex flex-col border-r border-t border-border h-full min-h-0 bg-white text-foreground min-w-0 flex-1 overflow-hidden">
      {/* Header của Cột */}
      <div className={`border-b border-border p-2.5 sm:p-3 flex-shrink-0 ${isToday ? "bg-accent/40" : "bg-white"}`}>
        <div className="flex justify-between items-center">
          <span
            className={`text-xs font-semibold ${
              isToday ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            {day.format("dddd")}
            {isToday && " - Hôm nay"}
          </span>
          {role === "teacher" && (
            <button
              onClick={onAdd}
              className="h-6 w-6 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground
                       flex items-center justify-center text-lg font-medium transition-colors"
              aria-label="Thêm lịch học"
            >
              +
            </button>
          )}
        </div>
        <div
          className={`text-2xl font-bold mt-0.5 ${
            isToday ? "text-primary" : "text-foreground"
          }`}
        >
          {day.format("DD/MM")}
        </div>
      </div>

      {/* Body của Cột */}
      <div className="flex-1 p-2 overflow-y-auto scrollbar-thin min-h-0">
        {events.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm mt-4">
            Không có lịch học
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {events.map((event) => (
              <EventItem key={event.id} event={event} onEdit={onEdit} onDelete={onDelete} role={role} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize component để tránh unnecessary re-renders
export default memo(DayColumn);
export type { DayColumnProps, ScheduleEvent };