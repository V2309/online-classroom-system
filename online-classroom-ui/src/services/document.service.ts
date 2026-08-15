import { api } from '@/lib/api';
import {
  ClassDocumentsResponse,
  CreateDocumentPayload,
  DocumentItem,
  DocumentViewersResponse,
} from '@/types/document';

export const documentService = {
  // ─── Lấy danh sách tài liệu ──────────────────────────────────────────────
  async getDocuments(params?: {
    classCode?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ClassDocumentsResponse> {
    const response = await api.get<ClassDocumentsResponse>('/documents', {
      params,
    });
    return response.data;
  },

  // ─── Lấy chi tiết tài liệu & ghi nhận lượt xem ───────────────────────────
  async getDocumentDetail(docId: string): Promise<DocumentItem> {
    const response = await api.get<DocumentItem>(`/documents/${docId}`);
    return response.data;
  },

  // ─── Lấy thống kê & danh sách người xem tài liệu ─────────────────────────
  async getDocumentViewers(docId: string): Promise<DocumentViewersResponse> {
    const response = await api.get<DocumentViewersResponse>(
      `/documents/${docId}/viewers`
    );
    return response.data;
  },

  // ─── Tạo tài liệu mới ────────────────────────────────────────────────────
  async createDocument(data: CreateDocumentPayload): Promise<DocumentItem> {
    const response = await api.post<DocumentItem>('/documents', data);
    return response.data;
  },

  // ─── Xóa tài liệu ────────────────────────────────────────────────────────
  async deleteDocument(docId: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/documents/${docId}`);
    return response.data;
  },
};
