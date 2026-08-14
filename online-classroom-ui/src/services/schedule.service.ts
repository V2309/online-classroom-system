import { api } from '@/lib/api';
import type {
  ScheduleEvent,
  CreateScheduleRequest,
  CreateMeetingScheduleRequest,
  UpdateScheduleRequest,
  RecurrenceGroupResponse,
} from '@/types/schedule';

export const scheduleService = {
  // Lấy danh sách lịch học của user (tự động theo role)
  async getSchedules(classCode?: string): Promise<ScheduleEvent[]> {
    const response = await api.get<ScheduleEvent[]>('/schedule', {
      params: classCode ? { classCode } : undefined,
    });
    return response.data;
  },

  // Lấy meeting sắp tới gần nhất
  async getUpcomingMeeting(): Promise<ScheduleEvent | null> {
    const response = await api.get<ScheduleEvent | null>('/schedule/upcoming-meeting');
    return response.data;
  },

  // Lấy event theo meetingId
  async getEventByMeetingId(meetingId: string): Promise<ScheduleEvent | null> {
    const response = await api.get<ScheduleEvent | null>(`/schedule/meeting/${meetingId}`);
    return response.data;
  },

  // Kiểm tra chuỗi lặp lại của event
  async checkRecurrenceGroup(id: number): Promise<RecurrenceGroupResponse | null> {
    const response = await api.get<RecurrenceGroupResponse | null>(`/schedule/recurrence-check/${id}`);
    return response.data;
  },

  // Tạo lịch học mới
  async createSchedule(
    data: CreateScheduleRequest,
  ): Promise<{ success: boolean; message: string; data?: ScheduleEvent }> {
    const response = await api.post<{ success: boolean; message: string; data?: ScheduleEvent }>(
      '/schedule',
      data,
    );
    return response.data;
  },

  // Tạo lịch cuộc họp trực tuyến
  async createMeetingSchedule(
    data: CreateMeetingScheduleRequest,
  ): Promise<{
    success: boolean;
    message: string;
    data?: { meetingId?: string; meetingLink?: string; event?: ScheduleEvent };
  }> {
    const response = await api.post<{
      success: boolean;
      message: string;
      data?: { meetingId?: string; meetingLink?: string; event?: ScheduleEvent };
    }>('/schedule/meeting', data);
    return response.data;
  },

  // Sửa 1 event
  async updateSingleEvent(
    id: number,
    data: UpdateScheduleRequest,
  ): Promise<{ success: boolean; message: string; data?: ScheduleEvent }> {
    const response = await api.patch<{ success: boolean; message: string; data?: ScheduleEvent }>(
      `/schedule/${id}`,
      data,
    );
    return response.data;
  },

  // Sửa tất cả events trong chuỗi lặp lại
  async updateAllRecurrenceEvents(
    id: number,
    data: UpdateScheduleRequest,
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.patch<{ success: boolean; message: string }>(
      `/schedule/${id}/recurrence`,
      data,
    );
    return response.data;
  },

  // Xóa 1 event
  async deleteSingleEvent(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/schedule/${id}`);
    return response.data;
  },

  // Xóa tất cả events trong chuỗi lặp lại
  async deleteAllRecurrenceEvents(
    id: number,
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/schedule/${id}/recurrence`,
    );
    return response.data;
  },
};
