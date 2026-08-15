import {api} from "@/lib/api";

export interface UploadResponse {
  url: string;
  filePath: string;
  fileId: string;
  name: string;
  height?: number;
  width?: number;
  fileType: string;
}

export const uploadService = {
  // Upload file tổng quát (ImageKit)
  async uploadFile(file: File, folder?: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<UploadResponse>("/upload", formData, {
      params: folder ? { folder } : {},
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Upload tài liệu lớp học lên Cloudflare R2
  async uploadDocument(file: File, folder?: string): Promise<{ url: string; key: string; name: string; size: number; type: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<{ url: string; key: string; name: string; size: number; type: string }>("/upload/document", formData, {
      params: folder ? { folder } : {},
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Upload ảnh bìa lớp học
  async uploadClassImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<UploadResponse>("/upload/class-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Upload avatar người dùng
  async uploadAvatar(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<UploadResponse>("/upload/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Upload media bài viết (ảnh/video)
  async uploadPostMedia(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<UploadResponse>("/upload/posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
