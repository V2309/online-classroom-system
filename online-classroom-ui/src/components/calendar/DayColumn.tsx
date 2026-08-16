"use client";

import moment from "moment";
import { memo } from "react";
import EventItem from "./EventItem";
import { Plus } from "lucide-react";

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
    <div className="flex flex-col h-full min-h-0 bg-white text-foreground min-w-[120px] flex-1 overflow-hidden">
      {/* Header của Cột */}
      <div
        className={`border-b p-3 flex-shrink-0 transition-colors ${
          isToday
            ? "bg-accent/70 border-primary/30 text-primary"
            : "bg-muted/40 border-border text-foreground"
        }`}
      >
        <div className="flex justify-between items-center mb-1">
          <span
            className={`text-xs font-bold capitalize select-none ${
              isToday ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {day.format("dddd")}
          </span>
          {role === "teacher" && (
            <button
              type="button"
              onClick={onAdd}
              className="h-6 w-6 rounded-lg bg-white/80 hover:bg-primary hover:text-primary-foreground text-foreground flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Thêm lịch học vào ngày này"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-xl font-heading font-bold ${
              isToday ? "text-primary" : "text-foreground"
            }`}
          >
            {day.format("DD/MM")}
          </span>
          {isToday && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.2 rounded-full">
              Hôm nay
            </span>
          )}
        </div>
      </div>

      {/* Body của Cột chứa các sự kiện */}
      <div className="flex-1 p-2.5 overflow-y-auto scrollbar-thin min-h-0 space-y-2">
        {events.length === 0 ? (
          <div className="text-center text-muted-foreground/50 text-xs py-8 select-none">
            Trống
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {events.map((event) => (
              <EventItem
                key={event.id}
                event={event}
                onEdit={onEdit}
                onDelete={onDelete}
                role={role}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(DayColumn);
export type { DayColumnProps, ScheduleEvent };