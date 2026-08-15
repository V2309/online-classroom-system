import { api } from '@/lib/api';
import {
  CreateHomeworkRequest,
  QuestionData,
  UpdateHomeworkSettingsRequest,
  SubmitHomeworkRequest,
  GradeSubmissionRequest,
  SaveDraftRequest,
  SubmissionDetailQuery,
  SubmissionCountResponse,
  DownloadInfoResponse,
} from '@/types/homework';

export * from '@/types/homework';

export const homeworkService = {
  // 1. Tạo bài tập mới
  async createHomework(data: CreateHomeworkRequest) {
    const response = await api.post('/homework', data);
    return response.data;
  },

  // 2. Lấy chi tiết bài tập theo ID
  async getHomeworkById(homeworkId: number | string) {
    const response = await api.get(`/homework/${homeworkId}`);
    return response.data;
  },

  // 3. Lấy danh sách bài tập của lớp
  async getClassHomeworks(classCode: string) {
    const response = await api.get(`/homework/class/${classCode}`);
    return response.data;
  },

  // 4. Cập nhật câu hỏi bài tập
  async updateHomeworkWithQuestions(
    homeworkId: number | string,
    questions: QuestionData[],
  ) {
    const response = await api.patch(`/homework/${homeworkId}/questions`, {
      questions,
    });
    return response.data;
  },

  // 5. Cập nhật cấu hình bài tập
  async updateHomeworkSettings(
    homeworkId: number | string,
    data: UpdateHomeworkSettingsRequest,
  ) {
    const response = await api.patch(`/homework/${homeworkId}/settings`, data);
    return response.data;
  },

  // 6. Xóa bài tập
  async deleteHomework(homeworkId: number | string) {
    const response = await api.delete(`/homework/${homeworkId}`);
    return response.data;
  },

  // 7. Lưu nháp bài làm (học sinh)
  async saveDraft(homeworkId: number | string, data: SaveDraftRequest) {
    const response = await api.post(`/homework/${homeworkId}/save`, data);
    return response.data;
  },

  // 8. Nộp bài làm
  async submitHomework(
    homeworkId: number | string,
    data: SubmitHomeworkRequest,
  ) {
    const response = await api.post(`/homework/${homeworkId}/submit`, data);
    return response.data;
  },

  // 9. Giáo viên chấm điểm bài nộp
  async gradeSubmission(
    homeworkId: number | string,
    data: GradeSubmissionRequest,
  ) {
    const response = await api.post(`/homework/${homeworkId}/grade`, data);
    return response.data;
  },

  // 10. Đếm số lượt nộp và điểm tốt nhất
  async getSubmissionsCount(
    homeworkId: number | string,
  ): Promise<SubmissionCountResponse> {
    const response = await api.get('/homework/submissions/count', {
      params: { homeworkId },
    });
    return response.data;
  },

  // 11. Lấy chi tiết bài nộp
  async getSubmissionDetail(params: SubmissionDetailQuery) {
    const response = await api.get('/homework/submissions/detail', {
      params,
    });
    return response.data;
  },

  // 12. Lấy dữ liệu tổng hợp bài nộp của lớp cho giáo viên
  async getTeacherDetail(homeworkId: number | string) {
    const response = await api.get(`/homework/${homeworkId}/teacher-detail`);
    return response.data;
  },

  // 13. Lấy thông tin tải file đề gốc
  async getDownloadInfo(
    homeworkId: number | string,
  ): Promise<DownloadInfoResponse> {
    const response = await api.get(`/homework/${homeworkId}/download`);
    return response.data;
  },

  // 14. Xuất file Excel nộp bài
  async exportSubmissions(homeworkId: number | string): Promise<Blob> {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api';
    const response = await fetch(`${baseURL}/homework/${homeworkId}/export`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Xuất file thất bại');
    }
    return await response.blob();
  },
};
