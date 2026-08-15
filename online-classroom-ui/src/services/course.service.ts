import { api } from '@/lib/api';
import {
  ClassCoursesResponse,
  CourseItem,
  CreateCoursePayload,
  CreateFolderPayload,
  FolderItem,
  UpdateCoursePayload,
  UpdateFolderPayload,
} from '@/types/course';

export const courseService = {
  // ─── Lấy danh sách khóa học của lớp ──────────────────────────────────────
  async getClassCourses(
    classCode: string,
    params?: { search?: string; folderId?: string; page?: number; limit?: number }
  ): Promise<ClassCoursesResponse> {
    const response = await api.get<ClassCoursesResponse>(
      `/courses/class/${classCode}`,
      { params }
    );
    return response.data;
  },

  // ─── Lấy danh sách folders của lớp ───────────────────────────────────────
  async getClassFolders(classCode: string): Promise<FolderItem[]> {
    const response = await api.get<FolderItem[]>(
      `/courses/class/${classCode}/folders`
    );
    return response.data;
  },

  // ─── Lấy chi tiết khóa học ───────────────────────────────────────────────
  async getCourseById(courseId: string, classCode: string): Promise<CourseItem> {
    const response = await api.get<CourseItem>(`/courses/${courseId}`, {
      params: { classCode },
    });
    return response.data;
  },

  // ─── Tạo khóa học mới ────────────────────────────────────────────────────
  async createCourse(data: CreateCoursePayload): Promise<CourseItem> {
    const response = await api.post<CourseItem>('/courses', data);
    return response.data;
  },

  // ─── Cập nhật khóa học ───────────────────────────────────────────────────
  async updateCourse(
    courseId: string,
    data: UpdateCoursePayload
  ): Promise<CourseItem> {
    const response = await api.patch<CourseItem>(`/courses/${courseId}`, data);
    return response.data;
  },

  // ─── Xóa khóa học ────────────────────────────────────────────────────────
  async deleteCourse(courseId: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/courses/${courseId}`);
    return response.data;
  },

  // ─── Di chuyển khóa học vào folder ───────────────────────────────────────
  async moveCourseToFolder(
    courseId: string,
    data: { newFolderId: string | null; classCode: string }
  ): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      `/courses/${courseId}/move`,
      data
    );
    return response.data;
  },

  // ─── Tạo thư mục mới ─────────────────────────────────────────────────────
  async createFolder(data: CreateFolderPayload): Promise<FolderItem> {
    const response = await api.post<FolderItem>('/courses/folders', data);
    return response.data;
  },

  // ─── Sửa thư mục ─────────────────────────────────────────────────────────
  async updateFolder(
    folderId: string,
    data: UpdateFolderPayload
  ): Promise<FolderItem> {
    const response = await api.patch<FolderItem>(
      `/courses/folders/${folderId}`,
      data
    );
    return response.data;
  },

  // ─── Xóa thư mục ─────────────────────────────────────────────────────────
  async deleteFolder(folderId: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(
      `/courses/folders/${folderId}`
    );
    return response.data;
  },
};
