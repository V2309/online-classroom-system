"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ScheduleSchema, MeetingScheduleSchema } from "@/lib/formValidationSchema";
import moment from "moment";

type CurrentState = { success: boolean; error: boolean; message?: string; data?: any };

// Tạo lịch học mới (Event)
export const createSchedule = async (
  currentState: CurrentState,
  data: ScheduleSchema
): Promise<CurrentState> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") {
      return { success: false, error: true, message: "Unauthorized" };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id as string },
    });
    if (!teacher) {
      return { success: false, error: true, message: "Teacher not found" };
    }

    // Kiểm tra xem lớp có thuộc về giáo viên này không
    const classExists = await prisma.class.findFirst({
      where: {
        id: data.classId,
        supervisorId: teacher.id,
        deleted: false,
      },
    });

    if (!classExists) {
      return { success: false, error: true, message: "Class not found or access denied" };
    }

    // Kết hợp ngày và thời gian để tạo DateTime
    const startDateTime = moment(`${data.date} ${data.startTime}`, "YYYY-MM-DD HH:mm").toDate();
    const endDateTime = moment(`${data.date} ${data.endTime}`, "YYYY-MM-DD HH:mm").toDate();

    // Validate thời gian
    if (endDateTime <= startDateTime) {
      return { success: false, error: true, message: "Thời gian kết thúc phải sau thời gian bắt đầu" };
    }

    // Handle recurrence options: if recurrenceType is NONE -> create single event
    const recurrenceType = (data as any).recurrenceType || 'NONE';
    const interval = Number((data as any).interval || 1);
    const recurrenceEndRaw = (data as any).recurrenceEnd;
    const weekDays: number[] = Array.isArray((data as any).weekDays) ? (data as any).weekDays.map(Number) : [];
    const maxOccurrences = (data as any).maxOccurrences ? Number((data as any).maxOccurrences) : null;

    if (!recurrenceType || recurrenceType === 'NONE') {
      // Single event
      await prisma.event.create({
        data: {
          title: data.title,
          description: data.description || "",
          startTime: startDateTime,
          endTime: endDateTime,
          classId: data.classId,
        },
      });
    } else {
      // Generate occurrences (simple generator supporting DAILY, WEEKLY (with weekDays), MONTHLY_BY_DATE)
      const occurrences: Array<{ start: Date; end: Date }> = [];

      const recurrenceEnd = recurrenceEndRaw ? new Date(recurrenceEndRaw) : null;

      // Safety cap
      const CAP = 200;

      // Helper to push occurrence if within limits
      const pushIfValid = (s: Date, e: Date) => {
        if (recurrenceEnd && s > recurrenceEnd) return false;
        occurrences.push({ start: new Date(s), end: new Date(e) });
        if (maxOccurrences && occurrences.length >= maxOccurrences) return false;
        if (occurrences.length >= CAP) return false;
        return true;
      };

      if (recurrenceType === 'DAILY') {
        let s = new Date(startDateTime);
        let e = new Date(endDateTime);
        while (pushIfValid(s, e)) {
          // advance
          s = new Date(s.getTime() + interval * 24 * 60 * 60 * 1000);
          e = new Date(e.getTime() + interval * 24 * 60 * 60 * 1000);
        }
      } else if (recurrenceType === 'WEEKLY' || recurrenceType === 'CUSTOM') {
        // weekDays array expected (0=Sun..6=Sat). If empty, use original day
        const daysSet = new Set(weekDays.length ? weekDays : [startDateTime.getUTCDay()]);
        let s = new Date(startDateTime);
        let e = new Date(endDateTime);
        // iterate day-by-day, but count weeks to respect interval
        const startBase = new Date(startDateTime);
        let dayCursor = new Date(startBase);
        let iterations = 0;
        while (true) {
          const dayOfWeek = dayCursor.getUTCDay();
          const daysSinceStart = Math.floor((dayCursor.getTime() - startBase.getTime()) / (24 * 60 * 60 * 1000));
          const weekIndex = Math.floor(daysSinceStart / 7);
          const shouldInclude = daysSet.has(dayOfWeek) && (weekIndex % interval === 0);
          if (shouldInclude) {
            // compute corresponding times for this day
            const sOcc = new Date(dayCursor);
            sOcc.setUTCHours(startDateTime.getUTCHours(), startDateTime.getUTCMinutes(), 0, 0);
            const eOcc = new Date(sOcc.getTime() + (endDateTime.getTime() - startDateTime.getTime()));
            if (!pushIfValid(sOcc, eOcc)) break;
          }
          // advance one day
          dayCursor = new Date(dayCursor.getTime() + 24 * 60 * 60 * 1000);
          iterations++;
          if (recurrenceEnd && dayCursor > recurrenceEnd) break;
          if (maxOccurrences && occurrences.length >= maxOccurrences) break;
          if (iterations > CAP * 7) break; // safety
        }
      } else if (recurrenceType === 'MONTHLY_BY_DATE') {
        // repeat same day-of-month
        let s = new Date(startDateTime);
        let e = new Date(endDateTime);
        while (pushIfValid(s, e)) {
          const next = new Date(s);
          next.setUTCMonth(next.getUTCMonth() + interval);
          const nextE = new Date(e);
          nextE.setUTCMonth(nextE.getUTCMonth() + interval);
          s = next;
          e = nextE;
        }
      } else {
        // fallback: create single
        occurrences.push({ start: startDateTime, end: endDateTime });
      }

      // bulk insert occurrences
      if (occurrences.length > 0) {
        const createData = occurrences.map(o => ({
          title: data.title,
          description: data.description || "",
          startTime: o.start,
          endTime: o.end,
          classId: data.classId,
        }));
        // use createMany for speed
        await prisma.event.createMany({ data: createData });
      }
    }

    revalidatePath("/schedule");
    return { success: true, error: false, message: "Tạo lịch học thành công!" };
  } catch (err) {
    console.error("Create schedule error:", err);
    return { success: false, error: true, message: "Có lỗi xảy ra khi tạo lịch học" };
  }
};

// Tạo lịch cuộc họp mới (Event với meeting link) - được gọi từ client
export const createMeetingSchedule = async (
  currentState: CurrentState,
  data: MeetingScheduleSchema & { meetingId?: string; meetingLink?: string }
): Promise<CurrentState> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") {
      return { success: false, error: true, message: "Unauthorized" };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id as string },
    });
    if (!teacher) {
      return { success: false, error: true, message: "Teacher not found" };
    }

    // Kiểm tra xem lớp có thuộc về giáo viên này không
    const classExists = await prisma.class.findFirst({
      where: {
        id: data.classId,
        supervisorId: teacher.id,
        deleted: false,
      },
    });

    if (!classExists) {
      return { success: false, error: true, message: "Class not found or access denied" };
    }

    // Kết hợp ngày và thời gian để tạo DateTime
    const startDateTime = moment(`${data.date} ${data.startTime}`, "YYYY-MM-DD HH:mm").toDate();
    const endDateTime = moment(`${data.date} ${data.endTime}`, "YYYY-MM-DD HH:mm").toDate();

    // Validate thời gian
    if (endDateTime <= startDateTime) {
      return { success: false, error: true, message: "Thời gian kết thúc phải sau thời gian bắt đầu" };
    }

    // Sử dụng meetingLink đã được tạo từ client hoặc tạo mới
    const meetingLink = data.meetingLink || (data.meetingId ? `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${data.meetingId}` : null);

    // Handle recurrence options: if recurrenceType is NONE -> create single event
    const recurrenceType = (data as any).recurrenceType || 'NONE';
    const interval = Number((data as any).interval || 1);
    const recurrenceEndRaw = (data as any).recurrenceEnd;
    const weekDays: number[] = Array.isArray((data as any).weekDays) ? (data as any).weekDays.map(Number) : [];
    const maxOccurrences = (data as any).maxOccurrences ? Number((data as any).maxOccurrences) : null;

    if (!recurrenceType || recurrenceType === 'NONE') {
      // Single meeting event
      await prisma.event.create({
        data: {
          title: data.title,
          description: data.description || "",
          startTime: startDateTime,
          endTime: endDateTime,
          classId: data.classId,
          meetingLink: meetingLink,
        },
      });
    } else {
      // Generate occurrences cho meeting (tương tự createSchedule)
      const occurrences: Array<{ start: Date; end: Date }> = [];
      
      let s = new Date(startDateTime);
      let e = new Date(endDateTime);
      const endDate = recurrenceEndRaw ? moment(recurrenceEndRaw).toDate() : null;
      let count = 0;
      
      // Generate occurrences similar to createSchedule logic
      while ((!endDate || s <= endDate) && (!maxOccurrences || count < maxOccurrences)) {
        if (count > 100) break; // Safety limit
        
        occurrences.push({ start: new Date(s), end: new Date(e) });
        count++;

        if (recurrenceType === "DAILY") {
          s.setUTCDate(s.getUTCDate() + interval);
          e.setUTCDate(e.getUTCDate() + interval);
        } else if (recurrenceType === "WEEKLY") {
          if (weekDays.length > 0) {
            // Find next occurrence based on weekDays
            let found = false;
            let attempts = 0;
            
            while (!found && attempts < 14) {
              s.setUTCDate(s.getUTCDate() + 1);
              e.setUTCDate(e.getUTCDate() + 1);
              attempts++;
              
              const dayOfWeek = s.getUTCDay();
              if (weekDays.includes(dayOfWeek)) {
                found = true;
              }
            }
            
            if (!found) break;
          } else {
            s.setUTCDate(s.getUTCDate() + 7 * interval);
            e.setUTCDate(e.getUTCDate() + 7 * interval);
          }
        } else if (recurrenceType === "MONTHLY_BY_DATE") {
          const next = new Date(s);
          next.setUTCMonth(next.getUTCMonth() + interval);
          const nextE = new Date(e);
          nextE.setUTCMonth(nextE.getUTCMonth() + interval);
          s = next;
          e = nextE;
        }
      }

      // bulk insert occurrences với cùng meeting link
      if (occurrences.length > 0) {
        const createData = occurrences.map(o => ({
          title: data.title,
          description: data.description || "",
          startTime: o.start,
          endTime: o.end,
          classId: data.classId,
          meetingLink: meetingLink,
        }));
        await prisma.event.createMany({ data: createData });
      }
    }

    revalidatePath("/schedule");
    return { 
      success: true, 
      error: false, 
      message: "Tạo lịch cuộc họp thành công!", 
      data: { meetingId: data.meetingId, meetingLink } 
    };
  } catch (err) {
    console.error("Create meeting schedule error:", err);
    return { success: false, error: true, message: "Có lỗi xảy ra khi tạo lịch cuộc họp" };
  }
};

// Cập nhật lịch học (chỉ cho phép cập nhật title và description)
export const updateSchedule = async (
  currentState: CurrentState,
  data: ScheduleSchema & { id: number }
): Promise<CurrentState> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") {
      return { success: false, error: true, message: "Unauthorized" };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id as string },
    });
    if (!teacher) {
      return { success: false, error: true, message: "Teacher not found" };
    }

    // Kiểm tra xem event có tồn tại và thuộc về lớp của giáo viên không
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: data.id,
        class: {
          supervisorId: teacher.id,
          deleted: false,
        },
      },
    });

    if (!existingEvent) {
      return { success: false, error: true, message: "Event not found or access denied" };
    }

    // Validate input - chỉ title là bắt buộc
    if (!data.title || data.title.trim() === "") {
      return { success: false, error: true, message: "Tên buổi học không được để trống" };
    }

    // Cập nhật event - CHỈ CẬP NHẬT title và description
    // Không cho phép thay đổi thời gian, ngày, lớp học, hoặc các cài đặt lặp lại
    await prisma.event.update({
      where: { id: data.id },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || "",
        // BỎ CÁC TRƯỜNG KHÁC: startTime, endTime, classId
      },
    });

    revalidatePath("/schedule");
    return { success: true, error: false, message: "Cập nhật lịch học thành công!" };
  } catch (err) {
    console.error("Update schedule error:", err);
    return { success: false, error: true, message: "Có lỗi xảy ra khi cập nhật lịch học" };
  }
};

// Xóa lịch học
export const deleteSchedule = async (
  currentState: CurrentState,
  data: { id: number }
): Promise<CurrentState> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") {
      return { success: false, error: true, message: "Unauthorized" };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id as string },
    });
    if (!teacher) {
      return { success: false, error: true, message: "Teacher not found" };
    }

    // Kiểm tra xem event có tồn tại và thuộc về lớp của giáo viên không
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: data.id,
        class: {
          supervisorId: teacher.id,
          deleted: false,
        },
      },
    });

    if (!existingEvent) {
      return { success: false, error: true, message: "Event not found or access denied" };
    }

    // Xóa event
    await prisma.event.delete({
      where: { id: data.id },
    });

    revalidatePath("/schedule");
    return { success: true, error: false, message: "Xóa lịch học thành công!" };
  } catch (err) {
    console.error("Delete schedule error:", err);
    return { success: false, error: true, message: "Có lỗi xảy ra khi xóa lịch học" };
  }
};

// Lấy danh sách lịch học của giáo viên
export async function getTeacherSchedules() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") {
      return [];
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id as string },
    });
    if (!teacher) {
      return [];
    }

    const events = await prisma.event.findMany({
      where: {
        class: {
          supervisorId: teacher.id,
          deleted: false,
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            class_code: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      meetingLink: event.meetingLink,
      class: event.class,
    }));
  } catch (error) {
    console.error("Get teacher schedules error:", error);
    return [];
  }
}

// Lấy danh sách lịch học của học sinh (từ các lớp mà học sinh đã tham gia)
export async function getStudentSchedules() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "student") {
      return [];
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id as string },
      include: {
        classes: {
          where: {
            deleted: false,
          },
          select: {
            id: true,
          },
        },
      },
    });
    if (!student) {
      return [];
    }

    // Lấy tất cả classId mà học sinh tham gia
    const classIds = student.classes.map(cls => cls.id);

    if (classIds.length === 0) {
      return [];
    }

    const events = await prisma.event.findMany({
      where: {
        classId: {
          in: classIds,
        },
        class: {
          deleted: false,
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            class_code: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      meetingLink: event.meetingLink,
      class: event.class,
    }));
  } catch (error) {
    console.error("Get student schedules error:", error);
    return [];
  }
}

// Kiểm tra xem event có phải là phần của chuỗi lặp lại không
export const checkRecurrenceGroup = async (eventId: number) => {
  try {
    // Optimized: Lấy event và related events trong 1 transaction
    const [event, relatedEvents] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, classId: true, title: true, startTime: true }
      }),
      prisma.event.findFirst({
        where: { id: eventId },
        select: { classId: true, title: true, startTime: true }
      }).then(async (currentEvent) => {
        if (!currentEvent) return [];
        
        return prisma.event.findMany({
          where: {
            classId: currentEvent.classId,
            title: currentEvent.title,
            id: { not: eventId },
            startTime: {
              gte: new Date(currentEvent.startTime.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days before
              lte: new Date(currentEvent.startTime.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 days after
            }
          },
          select: { id: true, title: true, startTime: true, endTime: true },
          orderBy: { startTime: 'asc' }
        });
      })
    ]);
    
    if (!event) return null;

    if (relatedEvents.length > 0) {
      return {
        currentEvent: event,
        relatedEvents: relatedEvents,
        totalEvents: relatedEvents.length + 1
      };
    }

    return null;
  } catch (error) {
    console.error("Check recurrence group error:", error);
    return null;
  }
};

// Cập nhật chỉ event hiện tại
export const updateSingleEvent = async (
  currentState: CurrentState,
  data: { id: number; title: string; description?: string }
): Promise<CurrentState> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") {
      return { success: false, error: true, message: "Unauthorized" };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id as string },
    });
    if (!teacher) {
      return { success: false, error: true, message: "Teacher not found" };
    }

    // Kiểm tra quyền truy cập
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: data.id,
        class: {
          supervisorId: teacher.id,
          deleted: false,
        },
      },
    });

    if (!existingEvent) {
      return { success: false, error: true, message: "Event not found or access denied" };
    }

    // Validate input
    if (!data.title || data.title.trim() === "") {
      return { success: false, error: true, message: "Tên buổi học không được để trống" };
    }

    // Cập nhật chỉ event hiện tại
    await prisma.event.update({
      where: { id: data.id },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || "",
      },
    });

    revalidatePath("/schedule");
    return { success: true, error: false, message: "Cập nhật lịch học thành công!" };
  } catch (err) {
    console.error("Update single event error:", err);
    return { success: false, error: true, message: "Có lỗi xảy ra khi cập nhật lịch học" };
  }
};

// Cập nhật tất cả events trong chuỗi lặp lại
export const updateAllRecurrenceEvents = async (
  currentState: CurrentState,
  data: { id: number; title: string; description?: string }
): Promise<CurrentState> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") {
      return { success: false, error: true, message: "Unauthorized" };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id as string },
    });
    if (!teacher) {
      return { success: false, error: true, message: "Teacher not found" };
    }

    // Lấy thông tin recurrence group
    const recurrenceGroup = await checkRecurrenceGroup(data.id);
    if (!recurrenceGroup) {
      // Không có recurrence group, chỉ update event hiện tại
      return updateSingleEvent(currentState, data);
    }

    // Validate input
    if (!data.title || data.title.trim() === "") {
      return { success: false, error: true, message: "Tên buổi học không được để trống" };
    }

    // Kiểm tra quyền truy cập cho event chính
    const hasAccess = await prisma.event.findFirst({
      where: {
        id: data.id,
        class: {
          supervisorId: teacher.id,
          deleted: false,
        },
      },
    });

    if (!hasAccess) {
      return { success: false, error: true, message: "Event not found or access denied" };
    }

    // Cập nhật tất cả events trong group
    const allEventIds = [data.id, ...recurrenceGroup.relatedEvents.map(e => e.id)];
    
    await prisma.event.updateMany({
      where: {
        id: { in: allEventIds },
        class: {
          supervisorId: teacher.id,
          deleted: false,
        },
      },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || "",
      },
    });

    revalidatePath("/schedule");
    return { 
      success: true, 
      error: false, 
      message: `Cập nhật thành công ${recurrenceGroup.totalEvents} lịch học!` 
    };
  } catch (err) {
    console.error("Update all recurrence events error:", err);
    return { success: false, error: true, message: "Có lỗi xảy ra khi cập nhật lịch học" };
  }
};

// Xóa chỉ event hiện tại
export const deleteSingleEvent = async (
  currentState: CurrentState,
  data: { id: number }
): Promise<CurrentState> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") {
      return { success: false, error: true, message: "Unauthorized" };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id as string },
    });
    if (!teacher) {
      return { success: false, error: true, message: "Teacher not found" };
    }

    // Kiểm tra quyền truy cập
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: data.id,
        class: {
          supervisorId: teacher.id,
          deleted: false,
        },
      },
    });

    if (!existingEvent) {
      return { success: false, error: true, message: "Event not found or access denied" };
    }

    // Xóa chỉ event hiện tại
    await prisma.event.delete({
      where: { id: data.id },
    });

    revalidatePath("/schedule");
    return { success: true, error: false, message: "Xóa lịch học thành công!" };
  } catch (err) {
    console.error("Delete single event error:", err);
    return { success: false, error: true, message: "Có lỗi xảy ra khi xóa lịch học" };
  }
};

// Xóa tất cả events trong chuỗi lặp lại
export const deleteAllRecurrenceEvents = async (
  currentState: CurrentState,
  data: { id: number }
): Promise<CurrentState> => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") {
      return { success: false, error: true, message: "Unauthorized" };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id as string },
    });
    if (!teacher) {
      return { success: false, error: true, message: "Teacher not found" };
    }

    // Lấy thông tin recurrence group
    const recurrenceGroup = await checkRecurrenceGroup(data.id);
    if (!recurrenceGroup) {
      // Không có recurrence group, chỉ xóa event hiện tại
      return deleteSingleEvent(currentState, data);
    }

    // Kiểm tra quyền truy cập cho event chính
    const hasAccess = await prisma.event.findFirst({
      where: {
        id: data.id,
        class: {
          supervisorId: teacher.id,
          deleted: false,
        },
      },
    });

    if (!hasAccess) {
      return { success: false, error: true, message: "Event not found or access denied" };
    }

    // Xóa tất cả events trong group
    const allEventIds = [data.id, ...recurrenceGroup.relatedEvents.map(e => e.id)];
    
    await prisma.event.deleteMany({
      where: {
        id: { in: allEventIds },
        class: {
          supervisorId: teacher.id,
          deleted: false,
        },
      },
    });

    revalidatePath("/schedule");
    return { 
      success: true, 
      error: false, 
      message: `Xóa thành công ${recurrenceGroup.totalEvents} lịch học!` 
    };
  } catch (err) {
    console.error("Delete all recurrence events error:", err);
    return { success: false, error: true, message: "Có lỗi xảy ra khi xóa lịch học" };
  }
};

// Lấy thông tin event từ meetingId
export const getEventByMeetingId = async (meetingId: string) => {
  try {
    const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meetingId}`;
    
    const event = await prisma.event.findFirst({
      where: { 
        meetingLink: meetingLink
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            class_code: true,
          }
        }
      }
    });
    
    return event;
  } catch (error) {
    console.error("Error getting event by meeting ID:", error);
    return null;
  }
};

// Lấy meeting sắp tới của user
export const getUpcomingMeeting = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const now = new Date();
    
    if (user.role === "teacher") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id as string },
      });
      if (!teacher) return null;

      const upcomingMeeting = await prisma.event.findFirst({
        where: {
          meetingLink: {
            not: null,
          },
          startTime: {
            gte: now,
          },
          class: {
            supervisorId: teacher.id,
            deleted: false,
          },
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              class_code: true,
            }
          }
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      return upcomingMeeting;
    } else {
      // Student
      const student = await prisma.student.findUnique({
        where: { userId: user.id as string },
      });
      if (!student) return null;

      const upcomingMeeting = await prisma.event.findFirst({
        where: {
          meetingLink: {
            not: null,
          },
          startTime: {
            gte: now,
          },
          class: {
            deleted: false,
            students: {
              some: {
                userId: user.id as string,
              }
            }
          },
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              class_code: true,
            }
          }
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      return upcomingMeeting;
    }
  } catch (error) {
    console.error("Error getting upcoming meeting:", error);
    return null;
  }
};