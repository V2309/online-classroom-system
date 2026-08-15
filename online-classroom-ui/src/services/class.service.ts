import { api } from '@/lib/api';
import {
  ClassItem,
  ClassListResponse,
  ClassMembersResponse,
  CreateClassRequest,
  JoinRequest,
  UpdateClassRequest,
} from '@/types/class';

export const classService = {
  // ─── Lấy danh sách lớp (teacher: lớp mình dạy, student: lớp đã tham gia) ──
  async getClasses(params?: {
    page?: number;
    type?: string;
    search?: string;
  }): Promise<ClassListResponse> {
    const response = await api.get<ClassListResponse>('/classes', {
      params: {
        page: params?.page,
        type: params?.type,
        search: params?.search,
      },
    });
    return response.data;
  },

  // ─── Lấy chi tiết 1 lớp ───────────────────────────────────────────────────
  async getClassById(classId: number): Promise<ClassItem> {
    const response = await api.get<ClassItem>(`/classes/${classId}`);
    return response.data;
  },

  // ─── Tạo lớp mới (teacher only) ───────────────────────────────────────────
  async createClass(data: CreateClassRequest): Promise<ClassItem> {
    const response = await api.post<ClassItem>('/classes', data);
    return response.data;
  },

  // ─── Sửa thông tin lớp (teacher owner) ───────────────────────────────────
  async updateClass(classId: number, data: UpdateClassRequest): Promise<ClassItem> {
    const response = await api.patch<ClassItem>(`/classes/${classId}`, data);
    return response.data;
  },

  // ─── Xóa mềm lớp (teacher owner) ─────────────────────────────────────────
  async deleteClass(classId: number): Promise<ClassItem> {
    const response = await api.delete<ClassItem>(`/classes/${classId}`);
    return response.data;
  },

  // ─── Khôi phục lớp đã xóa ────────────────────────────────────────────────
  async restoreClass(classId: number): Promise<ClassItem> {
    const response = await api.post<ClassItem>(`/classes/${classId}/restore`);
    return response.data;
  },

  // ─── Học sinh gửi yêu cầu tham gia lớp bằng mã lớp ─────────────────────
  async joinClass(classCode: string): Promise<JoinRequest> {
    const response = await api.post<JoinRequest>(`/classes/${classCode}/join`);
    return response.data;
  },

  // ─── Học sinh rời lớp ────────────────────────────────────────────────────
  async leaveClass(classId: number): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(`/classes/${classId}/leave`);
    return response.data;
  },

  // ─── Giáo viên xem danh sách yêu cầu vào lớp ────────────────────────────
  async getJoinRequests(classId: number): Promise<JoinRequest[]> {
    const response = await api.get<JoinRequest[]>(`/classes/${classId}/join-requests`);
    return response.data;
  },

  // ─── Duyệt yêu cầu tham gia lớp ─────────────────────────────────────────
  async approveJoinRequest(requestId: number): Promise<void> {
    await api.post(`/classes/join-requests/${requestId}/approve`);
  },

  // ─── Từ chối yêu cầu tham gia lớp ───────────────────────────────────────
  async rejectJoinRequest(requestId: number): Promise<void> {
    await api.post(`/classes/join-requests/${requestId}/reject`);
  },

  // ─── Lấy danh sách lớp đã xóa (teacher only) ─────────────────────
  async getDeletedClasses(): Promise<ClassItem[]> {
    const response = await api.get<ClassItem[]>('/classes/deleted');
    return response.data;
  },

  // ─── Lấy danh sách khối lớp (Grades) ───────────────────────────────────────
  async getGrades(): Promise<{ id: number; level: string }[]> {
    const response = await api.get<{ id: number; level: string }[]>('/classes/grades');
    return response.data;
  },

  // ─── Lấy danh sách thành viên của lớp ────────────────────────────────────
  async getClassMembers(
    classCode: string,
    params?: { page?: number; search?: string }
  ): Promise<ClassMembersResponse> {
    const response = await api.get<ClassMembersResponse>(`/classes/${classCode}/members`, {
      params,
    });
    return response.data;
  },

  // ─── Xóa học sinh khỏi lớp (teacher only) ─────────────────────────────────
  async removeStudentFromClass(
    classCode: string,
    studentId: string
  ): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(
      `/classes/${classCode}/members/${studentId}`
    );
    return response.data;
  },
};