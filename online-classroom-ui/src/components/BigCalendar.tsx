"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import moment from "moment";
import "moment/locale/vi";
import ScheduleForm from "@/components/forms/ScheduleForm";
import DayColumn from "@/components/calendar/DayColumn";
import RecurrenceUpdateDialog from "@/components/calendar/RecurrenceUpdateDialog";
import RecurrenceDeleteDialog from "@/components/calendar/RecurrenceDeleteDialog";
import type { ScheduleEvent } from "@/components/calendar/EventItem";
import { scheduleService } from "@/services/schedule.service";
import { toast } from "react-toastify";
import { Printer, CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";

moment.locale("vi");
moment.updateLocale("vi", { week: { dow: 1, doy: 4 } });

type EventColor = "blue" | "green" | "yellow";

interface BigCalendarProps {
  schedules?: Array<{
    id: number;
    title: string;
    description?: string | null;
    startTime: Date | string;
    endTime: Date | string;
    meetingLink?: string | null;
    class?: {
      id: number;
      name: string;
      class_code?: string | null;
    } | null;
  }>;
  role?: string;
  classId?: number;
  className?: string;
  teacherClasses?: any[];
}

const buildSevenDayRangeFrom = (anyDate: Date) => {
  const start = moment(anyDate).startOf("week");
  return Array.from({ length: 7 }, (_, i) => start.clone().add(i, "day"));
};

const formatWeekRangeVi = (date: Date) => {
  const start = moment(date).startOf("week");
  const end = start.clone().add(6, "day");
  const startFormat = start.isSame(end, "month") ? "D" : "D/M";
  return `Tuần ${start.format(startFormat)} - ${end.format("D/M")}, ${end.format("YYYY")}`;
};

const BigCalendar = ({
  schedules = [],
  role,
  classId,
  className,
  teacherClasses = [],
}: BigCalendarProps) => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedDateForForm, setSelectedDateForForm] = useState<Date | undefined>();
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [showRecurrenceDialog, setShowRecurrenceDialog] = useState(false);
  const [recurrenceData, setRecurrenceData] = useState<{
    eventId: number;
    title: string;
    description?: string;
    totalEvents: number;
  } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteData, setDeleteData] = useState<{
    eventId: number;
    title: string;
    totalEvents: number;
  } | null>(null);

  // Chuyển đổi dữ liệu schedules thành format phù hợp
  const allDayEvents = useMemo(() => {
    return schedules.map((schedule, index) => ({
      id: schedule.id,
      title: schedule.title,
      description: schedule.description || "",
      date: new Date(schedule.startTime),
      startTime: new Date(schedule.startTime),
      endTime: new Date(schedule.endTime),
      meetingLink: schedule.meetingLink || null,
      color: (["blue", "green", "yellow"][index % 3]) as EventColor,
      classInfo: schedule.class
        ? {
            id: schedule.class.id,
            name: schedule.class.name,
            class_code: schedule.class.class_code || null,
          }
        : undefined,
    }));
  }, [schedules]);

  const weekDays = useMemo(() => buildSevenDayRangeFrom(currentDate), [currentDate]);
  const isCurrentWeek = useMemo(() => moment(currentDate).isSame(new Date(), "week"), [currentDate]);

  const handlePrevWeek = useCallback(
    () => setCurrentDate(moment(currentDate).subtract(1, "week").toDate()),
    [currentDate]
  );

  const handleNextWeek = useCallback(
    () => setCurrentDate(moment(currentDate).add(1, "week").toDate()),
    [currentDate]
  );

  const handleGoToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleAddEvent = useCallback((date: moment.Moment) => {
    setSelectedDateForForm(date.toDate());
    setEditingEvent(null);
    setShowScheduleForm(true);
  }, []);

  const handleEditEvent = useCallback((event: ScheduleEvent) => {
    setEditingEvent(event);
    setSelectedDateForForm(event.date);
    setShowScheduleForm(true);
  }, []);

  const handleDeleteEvent = useCallback(async (event: ScheduleEvent) => {
    const recurrenceGroup = await scheduleService.checkRecurrenceGroup(event.id);
    setDeleteData({
      eventId: event.id,
      title: event.title,
      totalEvents: recurrenceGroup ? recurrenceGroup.totalEvents : 1,
    });
    setShowDeleteDialog(true);
  }, []);

  const handleScheduleSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleRecurrenceClose = useCallback(() => {
    setShowRecurrenceDialog(false);
    setRecurrenceData(null);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setShowDeleteDialog(false);
    setDeleteData(null);
  }, []);

  const handleEditSingleEvent = async () => {
    if (!recurrenceData) return;
    try {
      const result = await scheduleService.updateSingleEvent(recurrenceData.eventId, {
        title: recurrenceData.title,
        description: recurrenceData.description || "",
      });
      if (result.success) {
        setShowRecurrenceDialog(false);
        setRecurrenceData(null);
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating single event:", error);
    }
  };

  const handleEditAllEvents = async () => {
    if (!recurrenceData) return;
    try {
      const result = await scheduleService.updateAllRecurrenceEvents(recurrenceData.eventId, {
        title: recurrenceData.title,
        description: recurrenceData.description || "",
      });
      if (result.success) {
        setShowRecurrenceDialog(false);
        setRecurrenceData(null);
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating all events:", error);
    }
  };

  const handleDeleteSingleEvent = async () => {
    if (!deleteData) return;
    try {
      const result = await scheduleService.deleteSingleEvent(deleteData.eventId);
      if (result.success) {
        toast.success("Xóa lịch học thành công!");
        setShowDeleteDialog(false);
        setDeleteData(null);
        router.refresh();
      } else {
        toast.error(result.message || "Có lỗi xảy ra khi xóa lịch học");
      }
    } catch (error) {
      console.error("Error deleting single event:", error);
      toast.error("Có lỗi xảy ra khi xóa lịch học");
    }
  };

  const handleDeleteAllEvents = async () => {
    if (!deleteData) return;
    try {
      const result = await scheduleService.deleteAllRecurrenceEvents(deleteData.eventId);
      if (result.success) {
        toast.success(result.message || "Xóa lịch học thành công!");
        setShowDeleteDialog(false);
        setDeleteData(null);
        router.refresh();
      } else {
        toast.error(result.message || "Có lỗi xảy ra khi xóa lịch học");
      }
    } catch (error) {
      console.error("Error deleting all events:", error);
      toast.error("Có lỗi xảy ra khi xóa lịch học");
    }
  };

  return (
    <div className="h-full w-full bg-white rounded-3xl border border-border shadow-sm flex flex-col overflow-hidden">
      {/* ── 1. HEADER ĐIỀU HƯỚNG TÍCH HỢP TRONG CARD ── */}
      <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-shrink-0 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-accent text-primary flex items-center justify-center shadow-2xs flex-shrink-0">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-heading font-bold text-foreground leading-tight">
              {className ? `Lịch học: ${className}` : "Thời khóa biểu"}
            </h1>
            <p className="text-[11px] text-secondary hidden sm:block">Theo dõi lịch học và các buổi học trực tuyến</p>
          </div>
        </div>

        {/* Cụm điều hướng tuần & Thao tác */}
        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Cụm điều hướng tuần */}
          <div className="flex items-center bg-card rounded-2xl border border-border p-0.5 shadow-2xs">
            <button
              type="button"
              className="h-7 w-7 rounded-xl hover:bg-muted text-foreground flex items-center justify-center transition-colors cursor-pointer"
              onClick={handlePrevWeek}
              aria-label="Tuần trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="px-2.5 text-xs font-bold text-foreground select-none">
              {formatWeekRangeVi(currentDate)}
            </div>
            <button
              type="button"
              className="h-7 w-7 rounded-xl hover:bg-muted text-foreground flex items-center justify-center transition-colors cursor-pointer"
              onClick={handleNextWeek}
              aria-label="Tuần kế tiếp"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Nút Hôm nay */}
          <button
            type="button"
            onClick={handleGoToToday}
            disabled={isCurrentWeek}
            className="px-3 py-1.5 text-xs font-semibold rounded-2xl border border-border bg-white text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
          >
            Hôm nay
          </button>

          {/* Nút In lịch */}
          <button
            type="button"
            onClick={handlePrint}
            className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-2xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-all shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In lịch</span>
          </button>

          {/* Nút Thêm lịch (Cho giáo viên) */}
          {role === "teacher" && (
            <button
              type="button"
              onClick={() => handleAddEvent(moment(currentDate))}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-2xl text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm lịch</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2. LƯỚI 7 CỘT CHIẾM TRỌN CHIỀU CAO CÒN LẠI ── */}
      <div className="flex-1 grid grid-cols-7 w-full overflow-x-auto overflow-y-hidden min-h-0 divide-x divide-border/60 bg-white">
        {weekDays.map((day) => {
          const isToday = day.isSame(new Date(), "day");
          const eventsForDay = allDayEvents.filter((event) =>
            moment(event.date).isSame(day, "day")
          );

          return (
            <DayColumn
              key={day.toISOString()}
              day={day}
              isToday={isToday}
              events={eventsForDay}
              onAdd={() => handleAddEvent(day)}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              role={role}
            />
          );
        })}
      </div>

      {/* Schedule Form Modal */}
      {showScheduleForm && role === "teacher" && (
        <ScheduleForm
          type={editingEvent ? "update" : "create"}
          data={
            editingEvent
              ? {
                  id: editingEvent.id,
                  title: editingEvent.title,
                  description: editingEvent.description || "",
                  classId: editingEvent.classInfo?.id || classId || 0,
                  date: moment(editingEvent.date).format("YYYY-MM-DD"),
                  startTime: moment(editingEvent.startTime).format("HH:mm"),
                  endTime: moment(editingEvent.endTime).format("HH:mm"),
                }
              : undefined
          }
          selectedDate={selectedDateForForm}
          classId={classId}
          setOpen={(open) => {
            setShowScheduleForm(open);
            if (!open) setEditingEvent(null);
          }}
          onSuccess={handleScheduleSuccess}
          onUpdateSubmit={async (formData): Promise<boolean> => {
            if (!editingEvent) return false;
            const recurrenceGroup = await scheduleService.checkRecurrenceGroup(editingEvent.id);

            setRecurrenceData({
              eventId: editingEvent.id,
              title: formData.title,
              description: formData.description,
              totalEvents: recurrenceGroup ? recurrenceGroup.totalEvents : 1,
            });
            setShowRecurrenceDialog(true);
            setShowScheduleForm(false);
            return false;
          }}
          teacherClasses={teacherClasses}
        />
      )}

      {/* Recurrence Dialogs */}
      {showRecurrenceDialog && recurrenceData && (
        <RecurrenceUpdateDialog
          isOpen={showRecurrenceDialog}
          onClose={handleRecurrenceClose}
          onSelectSingle={handleEditSingleEvent}
          onSelectAll={handleEditAllEvents}
          totalEvents={recurrenceData.totalEvents}
        />
      )}

      {showDeleteDialog && deleteData && (
        <RecurrenceDeleteDialog
          isOpen={showDeleteDialog}
          onClose={handleDeleteClose}
          onSelectSingle={handleDeleteSingleEvent}
          onSelectAll={handleDeleteAllEvents}
          totalEvents={deleteData.totalEvents}
          eventTitle={deleteData.title}
        />
      )}
    </div>
  );
};

export default BigCalendar;