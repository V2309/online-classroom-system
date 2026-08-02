"use client";

import moment from "moment";
import { useState, memo } from "react";
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
    <div className="flex flex-col border-r border-t border-gray-200 h-[calc(100vh-200px)] min-h-[600px] bg-white">
      {/* Header của Cột */}
      <div className={` border-b p-3 ${isToday ? "bg-blue-50" : ""}`}>
        <div className="flex justify-between items-center">
          <span
            className={`text-xs font-semibold ${
              isToday ? "text-gray-900" : "text-gray-500"
            }`}
          >
            {day.format("dddd")}
            {isToday && " - Hôm nay"}
          </span>
          {role === "teacher" && (
            <button
              onClick={onAdd}
              className="h-6 w-6 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-800
                       flex items-center justify-center text-lg font-medium transition-colors"
              aria-label="Thêm lịch học"
            >
              +
            </button>
          )}
        </div>
        <div
          className={`text-2xl font-bold mt-0.5 ${
            isToday ? "text-blue-600" : "text-gray-900"
          }`}
        >
          {day.format("DD/MM")}
        </div>
      </div>

      {/* Body của Cột */}
      <div className="flex-1 p-2 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-4">
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