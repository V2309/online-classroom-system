export interface ScheduleClass {
  id: number;
  name: string;
  class_code?: string | null;
  img?: string | null;
  _count?: {
    students?: number;
  };
}

export interface ScheduleEvent {
  id: number;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  meetingLink?: string | null;
  classId?: number;
  class?: ScheduleClass | null;
}

export interface CreateScheduleRequest {
  title: string;
  description?: string;
  classId: number;
  date: string;
  startTime: string;
  endTime: string;
  recurrenceType?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY_BY_DATE" | "CUSTOM";
  interval?: number;
  recurrenceEnd?: string;
  weekDays?: number[];
  maxOccurrences?: number;
}

export interface CreateMeetingScheduleRequest extends CreateScheduleRequest {
  meetingId?: string;
  meetingLink?: string;
}

export interface UpdateScheduleRequest {
  title: string;
  description?: string;
}

export interface RecurrenceGroupResponse {
  currentEvent: {
    id: number;
    title: string;
    classId: number;
    startTime: string;
  };
  relatedEvents: Array<{
    id: number;
    title: string;
    startTime: string;
    endTime: string;
  }>;
  totalEvents: number;
}
