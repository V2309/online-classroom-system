"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import moment from "moment";
import "moment/locale/vi"; // Import Tiếng Việt
import ScheduleForm from "@/components/forms/ScheduleForm";
import DayColumn from "@/components/calendar/DayColumn";
import RecurrenceUpdateDialog from "@/components/calendar/RecurrenceUpdateDialog";
import RecurrenceDeleteDialog from "@/components/calendar/RecurrenceDeleteDialog";
import type { ScheduleEvent } from "@/components/calendar/EventItem";
import { checkRecurrenceGroup, updateSingleEvent, updateAllRecurrenceEvents, deleteSingleEvent, deleteAllRecurrenceEvents } from "@/lib/actions/schedule.action";
import { toast } from "react-toastify";
// 1. IMPORT ICON MỚI
import { Printer, CalendarDays } from "lucide-react";
// Cấu hình moment: Locale VI + tuần bắt đầu từ Thứ 2
moment.locale("vi");
moment.updateLocale("vi", { week: { dow: 1, doy: 4 } });

// --- 1. ĐỊNH NGHĨA TYPESCRIPT ---
type EventColor = "blue" | "green" | "yellow";

// Interface cho props component
interface BigCalendarProps {
  schedules?: Array<{
    id: number;
    title: string;
    description: string | null; // Sửa: cho phép null
    startTime: Date;
    endTime: Date;
    meetingLink?: string | null;
    class: {
      id: number;
      name: string;
      class_code: string | null;
    } | null;
  }>;
  role?: string;
  classId?: number; // ID lớp học hiện tại (nếu đang ở trang lớp cụ thể)
  teacherClasses?: any[]; // ** NHẬN PROP NÀY TỪ SERVER COMPONENT **
}



// --- Helper Functions ---
const buildSevenDayRangeFrom = (anyDate: Date) => {
  const start = moment(anyDate).startOf("week");
  return Array.from({ length: 7 }, (_, i) => start.clone().add(i, "day"));
};

const formatWeekRangeVi = (date: Date) => {
  const start = moment(date).startOf("week");
  const end = start.clone().add(6, "day");
  const startFormat = start.isSame(end, "month") ? "D" : "D/M";
  return `Tuần ${start.format(startFormat)} - ${end.format("D/M")}, ${end.format(
    "YYYY"
  )}`;
};

// --- Main Component ---
const AllDaySchedule = ({ schedules = [], role, classId, teacherClasses = [] }: BigCalendarProps) => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState<"week" | "month">("week");
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
      description: schedule.description || "", // Handle null case
      date: new Date(schedule.startTime),
      startTime: new Date(schedule.startTime),
      endTime: new Date(schedule.endTime),
      meetingLink: schedule.meetingLink || null,
      color: (["blue", "green", "yellow"][index % 3]) as EventColor,
      classInfo: schedule.class ? {
        id: schedule.class.id,
        name: schedule.class.name,
        class_code: schedule.class.class_code,
      } : undefined,
    }));
  }, [schedules]);

  // Tính toán 7 ngày trong tuần
  const weekDays = useMemo(
    () => buildSevenDayRangeFrom(currentDate),
    [currentDate]
  );
  // Biến kiểm tra xem có đang ở tuần hiện tại không
  const isCurrentWeek = useMemo(
    () => moment(currentDate).isSame(new Date(), "week"),
    [currentDate]
  );

  // --- Handlers (Optimized with useCallback) ---
  const handlePrevWeek = useCallback(() =>
    setCurrentDate(moment(currentDate).subtract(1, "week").toDate()),
    [currentDate]
  );

  const handleNextWeek = useCallback(() =>
    setCurrentDate(moment(currentDate).add(1, "week").toDate()),
    [currentDate]
  );
  // 2. THÊM HANDLER CHO NÚT "HÔM NAY"
  const handleGoToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // 3. THÊM HANDLER CHO NÚT IN
  const handlePrint = () => {
    window.print();
  };
  const handleViewChange = useCallback((view: "week" | "month") => {
    setActiveView(view);
  }, []);

  const handleAddEvent = useCallback((date: moment.Moment) => {
    setSelectedDateForForm(date.toDate());
    setEditingEvent(null); // Reset editing event
    setShowScheduleForm(true);
  }, []);

  const handleEditEvent = useCallback((event: ScheduleEvent) => {
    // Luôn mở ScheduleForm trước, sẽ handle recurrence logic trong form submit
    setEditingEvent(event);
    setSelectedDateForForm(event.date);
    setShowScheduleForm(true);
  }, []);

  const handleDeleteEvent = useCallback(async (event: ScheduleEvent) => {
    // Kiểm tra recurrence trước khi hiển thị dialog
    const recurrenceGroup = await checkRecurrenceGroup(event.id);

    setDeleteData({
      eventId: event.id,
      title: event.title,
      totalEvents: recurrenceGroup ? recurrenceGroup.totalEvents : 1
    });
    setShowDeleteDialog(true);
  }, []);

  const handleScheduleSuccess = useCallback(() => {
    // TỐI ƯU: Dùng router.refresh() để lấy lại dữ liệu mới (từ Server)
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
      const result = await updateSingleEvent(
        { success: false, error: false },
        {
          id: recurrenceData.eventId,
          title: recurrenceData.title,
          description: recurrenceData.description || ""
        }
      );

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
      const result = await updateAllRecurrenceEvents(
        { success: false, error: false },
        {
          id: recurrenceData.eventId,
          title: recurrenceData.title,
          description: recurrenceData.description || ""
        }
      );

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
      const result = await deleteSingleEvent(
        { success: false, error: false },
        { id: deleteData.eventId }
      );

      if (result.success) {
        toast.success('Xóa lịch học thành công!');
        setShowDeleteDialog(false);
        setDeleteData(null);
        router.refresh();
      } else {
        toast.error(result.message || 'Có lỗi xảy ra khi xóa lịch học');
      }
    } catch (error) {
      console.error("Error deleting single event:", error);
      toast.error('Có lỗi xảy ra khi xóa lịch học');
    }
  };

  const handleDeleteAllEvents = async () => {
    if (!deleteData) return;

    try {
      const result = await deleteAllRecurrenceEvents(
        { success: false, error: false },
        { id: deleteData.eventId }
      );

      if (result.success) {
        toast.success(result.message || 'Xóa lịch học thành công!');
        setShowDeleteDialog(false);
        setDeleteData(null);
        router.refresh();
      } else {
        toast.error(result.message || 'Có lỗi xảy ra khi xóa lịch học');
      }
    } catch (error) {
      console.error("Error deleting all events:", error);
      toast.error('Có lỗi xảy ra khi xóa lịch học');
    }
  };

  return (
    <div className="bg-white overflow-hidden print:border-0 print:shadow-none">
      {/* 1. Header Điều Hướng */}
      <div className="px-4 py-3 border-b border-gray-400 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">


          <div className="flex items-center gap-2">
            {/* Nút Tuần */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => handleViewChange("week")}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeView === "week"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                  } transition-all`}
              >
                Tuần
              </button>
              {/* (Nếu bạn muốn thêm lại nút Tháng, chỉ cần copy nút Tuần) */}
            </div>

            {/* 6. THÊM NÚT "HÔM NAY" */}
            <button
              onClick={handleGoToToday}
              disabled={isCurrentWeek} // Vô hiệu hóa nếu đang ở tuần này
              className="px-4 py-1.5 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Hôm nay
            </button>
          </div>


          <div className="flex items-center gap-2">
            <button
              className="h-8 w-8 rounded-md hover:bg-gray-100 transition-colors"
              onClick={handlePrevWeek}
              aria-label="Tuần trước"
            >
              ‹
            </button>
            <div className="text-sm sm:text-base font-semibold text-gray-800">
              {formatWeekRangeVi(currentDate)}
            </div>
            <button
              className="h-8 w-8 rounded-md hover:bg-gray-100 transition-colors"
              onClick={handleNextWeek}
              aria-label="Tuần kế tiếp"
            >
              ›
            </button>
          </div>
          {/* 7. THÊM NÚT IN, ẨN TRÊN MOBILE */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Printer size={16} />
              In lịch
            </button>
          </div>
        </div>
      </div>

      {/* 2. Lưới Lịch 7 Cột */}
     <div className="md:grid md:grid-cols-7 flex overflow-x-auto md:overflow-x-visible border-gray-200 md:border-l print:grid print:grid-cols-7 print:overflow-visible">
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
          data={editingEvent ? {
            id: editingEvent.id,
            title: editingEvent.title,
            description: editingEvent.description || "",
            classId: editingEvent.classInfo?.id || classId || 0,
            date: moment(editingEvent.date).format("YYYY-MM-DD"),
            startTime: moment(editingEvent.startTime).format("HH:mm"),
            endTime: moment(editingEvent.endTime).format("HH:mm"),
          } : undefined}
          selectedDate={selectedDateForForm}
          classId={classId}
          setOpen={(open) => {
            setShowScheduleForm(open);
            if (!open) setEditingEvent(null); // Reset editing event when closing
          }}
          onSuccess={handleScheduleSuccess}
          // Callback đặc biệt cho update với recurrence check
          onUpdateSubmit={async (formData): Promise<boolean> => {
            if (!editingEvent) return false;

            // Kiểm tra recurrence trước khi submit
            const recurrenceGroup = await checkRecurrenceGroup(editingEvent.id);

            // Luôn hiển thị dialog bước 2, bất kể có recurrence hay không
            setRecurrenceData({
              eventId: editingEvent.id,
              title: formData.title,
              description: formData.description,
              totalEvents: recurrenceGroup ? recurrenceGroup.totalEvents : 1
            });
            setShowRecurrenceDialog(true);
            setShowScheduleForm(false); // Đóng form chính
            return false; // Ngăn submit thông thường, chờ user chọn trong dialog
          }}
          // TỐI ƯU: Truyền danh sách lớp đã tải sẵn xuống form
          teacherClasses={teacherClasses}
        />
      )}

      {/* Recurrence Update Dialog */}
      {showRecurrenceDialog && recurrenceData && (
        <RecurrenceUpdateDialog
          isOpen={showRecurrenceDialog}
          onClose={handleRecurrenceClose}
          onSelectSingle={handleEditSingleEvent}
          onSelectAll={handleEditAllEvents}
          totalEvents={recurrenceData.totalEvents}
        />
      )}

      {/* Recurrence Delete Dialog */}
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



export default AllDaySchedule;