import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';
import {
  CreateMeetingScheduleDto,
  CreateScheduleDto,
  UpdateScheduleDto,
} from './dto/schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách lịch học của user (giáo viên hoặc học sinh)
   */
  async getUserSchedules(userId: string, role: string, classCode?: string) {
    if (role === 'teacher') {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });
      if (!teacher) return [];

      return this.prisma.event.findMany({
        where: {
          class: {
            supervisorId: teacher.id,
            deleted: false,
            ...(classCode ? { class_code: classCode } : {}),
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
          startTime: 'asc',
        },
      });
    } else {
      // Student
      const student = await this.prisma.student.findUnique({
        where: { userId },
        include: {
          classes: {
            where: {
              deleted: false,
              ...(classCode ? { class_code: classCode } : {}),
            },
            select: {
              id: true,
            },
          },
        },
      });
      if (!student || student.classes.length === 0) return [];

      const classIds = student.classes.map((cls) => cls.id);

      return this.prisma.event.findMany({
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
          startTime: 'asc',
        },
      });
    }
  }

  /**
   * Tạo lịch học mới (hỗ trợ sự kiện lặp lại)
   */
  async createSchedule(userId: string, dto: CreateScheduleDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) {
      throw new ForbiddenException('Chỉ giáo viên mới có quyền tạo lịch học.');
    }

    const classExists = await this.prisma.class.findFirst({
      where: {
        id: dto.classId,
        supervisorId: teacher.id,
        deleted: false,
      },
    });
    if (!classExists) {
      throw new NotFoundException('Lớp học không tồn tại hoặc bạn không có quyền.');
    }

    const startDateTime = new Date(`${dto.date}T${dto.startTime}:00`);
    const endDateTime = new Date(`${dto.date}T${dto.endTime}:00`);

    if (endDateTime <= startDateTime) {
      throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu.');
    }

    const occurrences = this.generateOccurrences(startDateTime, endDateTime, dto);

    if (occurrences.length === 1) {
      const created = await this.prisma.event.create({
        data: {
          title: dto.title,
          description: dto.description || '',
          startTime: occurrences[0].start,
          endTime: occurrences[0].end,
          classId: dto.classId,
        },
      });
      return { success: true, message: 'Tạo lịch học thành công!', data: created };
    }

    await this.prisma.event.createMany({
      data: occurrences.map((occ) => ({
        title: dto.title,
        description: dto.description || '',
        startTime: occ.start,
        endTime: occ.end,
        classId: dto.classId,
      })),
    });

    return {
      success: true,
      message: `Tạo thành công ${occurrences.length} buổi học!`,
    };
  }

  /**
   * Tạo lịch cuộc họp trực tuyến
   */
  async createMeetingSchedule(userId: string, dto: CreateMeetingScheduleDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) {
      throw new ForbiddenException('Chỉ giáo viên mới có quyền tạo cuộc họp.');
    }

    const classExists = await this.prisma.class.findFirst({
      where: {
        id: dto.classId,
        supervisorId: teacher.id,
        deleted: false,
      },
    });
    if (!classExists) {
      throw new NotFoundException('Lớp học không tồn tại hoặc bạn không có quyền.');
    }

    const startDateTime = new Date(`${dto.date}T${dto.startTime}:00`);
    const endDateTime = new Date(`${dto.date}T${dto.endTime}:00`);

    if (endDateTime <= startDateTime) {
      throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu.');
    }

    const meetingLink =
      dto.meetingLink ||
      (dto.meetingId ? `/meeting/${dto.meetingId}` : null);

    const occurrences = this.generateOccurrences(startDateTime, endDateTime, dto);

    if (occurrences.length === 1) {
      const created = await this.prisma.event.create({
        data: {
          title: dto.title,
          description: dto.description || '',
          startTime: occurrences[0].start,
          endTime: occurrences[0].end,
          classId: dto.classId,
          meetingLink,
        },
      });
      return {
        success: true,
        message: 'Tạo lịch cuộc họp thành công!',
        data: { meetingId: dto.meetingId, meetingLink, event: created },
      };
    }

    await this.prisma.event.createMany({
      data: occurrences.map((occ) => ({
        title: dto.title,
        description: dto.description || '',
        startTime: occ.start,
        endTime: occ.end,
        classId: dto.classId,
        meetingLink,
      })),
    });

    return {
      success: true,
      message: `Tạo thành công ${occurrences.length} buổi họp!`,
      data: { meetingId: dto.meetingId, meetingLink },
    };
  }

  /**
   * Cập nhật 1 event
   */
  async updateSingleEvent(userId: string, eventId: number, dto: UpdateScheduleDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) throw new ForbiddenException('Unauthorized');

    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        class: {
          supervisorId: teacher.id,
          deleted: false,
        },
      },
    });
    if (!event) throw new NotFoundException('Lịch học không tồn tại hoặc bạn không có quyền.');

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || '',
      },
    });

    return { success: true, message: 'Cập nhật lịch học thành công!', data: updated };
  }

  /**
   * Cập nhật tất cả event trong chuỗi lặp lại
   */
  async updateAllRecurrenceEvents(
    userId: string,
    eventId: number,
    dto: UpdateScheduleDto,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) throw new ForbiddenException('Unauthorized');

    const recurrenceGroup = await this.checkRecurrenceGroup(eventId);
    if (!recurrenceGroup) {
      return this.updateSingleEvent(userId, eventId, dto);
    }

    const allEventIds = [
      eventId,
      ...recurrenceGroup.relatedEvents.map((e) => e.id),
    ];

    await this.prisma.event.updateMany({
      where: {
        id: { in: allEventIds },
        class: {
          supervisorId: teacher.id,
          deleted: false,
        },
      },
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || '',
      },
    });

    return {
      success: true,
      message: `Cập nhật thành công ${recurrenceGroup.totalEvents} lịch học!`,
    };
  }

  /**
   * Xóa 1 event
   */
  async deleteSingleEvent(userId: string, eventId: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) throw new ForbiddenException('Unauthorized');

    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        class: {
          supervisorId: teacher.id,
          deleted: false,
        },
      },
    });
    if (!event) throw new NotFoundException('Lịch học không tồn tại hoặc bạn không có quyền.');

    await this.prisma.event.delete({
      where: { id: eventId },
    });

    return { success: true, message: 'Xóa lịch học thành công!' };
  }

  /**
   * Xóa tất cả event trong chuỗi lặp lại
   */
  async deleteAllRecurrenceEvents(userId: string, eventId: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) throw new ForbiddenException('Unauthorized');

    const recurrenceGroup = await this.checkRecurrenceGroup(eventId);
    if (!recurrenceGroup) {
      return this.deleteSingleEvent(userId, eventId);
    }

    const allEventIds = [
      eventId,
      ...recurrenceGroup.relatedEvents.map((e) => e.id),
    ];

    await this.prisma.event.deleteMany({
      where: {
        id: { in: allEventIds },
        class: {
          supervisorId: teacher.id,
          deleted: false,
        },
      },
    });

    return {
      success: true,
      message: `Xóa thành công ${recurrenceGroup.totalEvents} lịch học!`,
    };
  }

  /**
   * Kiểm tra xem event có thuộc chuỗi lặp lại không
   */
  async checkRecurrenceGroup(eventId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, classId: true, title: true, startTime: true },
    });
    if (!event) return null;

    const relatedEvents = await this.prisma.event.findMany({
      where: {
        classId: event.classId,
        title: event.title,
        id: { not: eventId },
        startTime: {
          gte: new Date(event.startTime.getTime() - 90 * 24 * 60 * 60 * 1000),
          lte: new Date(event.startTime.getTime() + 90 * 24 * 60 * 60 * 1000),
        },
      },
      select: { id: true, title: true, startTime: true, endTime: true },
      orderBy: { startTime: 'asc' },
    });

    if (relatedEvents.length > 0) {
      return {
        currentEvent: event,
        relatedEvents,
        totalEvents: relatedEvents.length + 1,
      };
    }

    return null;
  }

  /**
   * Lấy event từ meetingId
   */
  async getEventByMeetingId(meetingId: string) {
    return this.prisma.event.findFirst({
      where: {
        meetingLink: {
          contains: meetingId,
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
    });
  }

  /**
   * Lấy meeting sắp tới gần nhất của user
   */
  async getUpcomingMeeting(userId: string, role: string) {
    const now = new Date();

    if (role === 'teacher') {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });
      if (!teacher) return null;

      return this.prisma.event.findFirst({
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
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });
    } else {
      // Student
      const student = await this.prisma.student.findUnique({
        where: { userId },
      });
      if (!student) return null;

      return this.prisma.event.findFirst({
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
                userId,
              },
            },
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
          startTime: 'asc',
        },
      });
    }
  }

  // ─── Helper sinh các sự kiện lặp lại ─────────────────────────────────────
  private generateOccurrences(
    startDateTime: Date,
    endDateTime: Date,
    dto: CreateScheduleDto,
  ): Array<{ start: Date; end: Date }> {
    const recurrenceType = dto.recurrenceType || 'NONE';
    const interval = Number(dto.interval || 1);
    const recurrenceEnd = dto.recurrenceEnd
      ? new Date(dto.recurrenceEnd)
      : null;
    const weekDays = Array.isArray(dto.weekDays)
      ? dto.weekDays.map(Number)
      : [];
    const maxOccurrences = dto.maxOccurrences
      ? Number(dto.maxOccurrences)
      : null;

    if (!recurrenceType || recurrenceType === 'NONE') {
      return [{ start: startDateTime, end: endDateTime }];
    }

    const occurrences: Array<{ start: Date; end: Date }> = [];
    const CAP = 200;

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
        s = new Date(s.getTime() + interval * 24 * 60 * 60 * 1000);
        e = new Date(e.getTime() + interval * 24 * 60 * 60 * 1000);
      }
    } else if (recurrenceType === 'WEEKLY' || recurrenceType === 'CUSTOM') {
      const daysSet = new Set(
        weekDays.length ? weekDays : [startDateTime.getDay()],
      );
      let s = new Date(startDateTime);
      let e = new Date(endDateTime);
      const startBase = new Date(startDateTime);

      while (pushIfValid(s, e)) {
        let nextDay = new Date(s);
        let foundNext = false;

        for (let i = 1; i <= 7 * interval; i++) {
          nextDay.setDate(nextDay.getDate() + 1);
          if (daysSet.has(nextDay.getDay())) {
            const diffDays = Math.floor(
              (nextDay.getTime() - startBase.getTime()) / (24 * 60 * 60 * 1000),
            );
            const weekIndex = Math.floor(diffDays / 7);
            if (weekIndex % interval === 0) {
              const duration = endDateTime.getTime() - startDateTime.getTime();
              s = new Date(nextDay);
              e = new Date(nextDay.getTime() + duration);
              foundNext = true;
              break;
            }
          }
        }
        if (!foundNext) break;
      }
    } else {
      occurrences.push({ start: startDateTime, end: endDateTime });
    }

    return occurrences;
  }
}
