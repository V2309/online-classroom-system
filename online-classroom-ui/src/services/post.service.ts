import {api} from "@/lib/api";
import {
  CreateCommentRequest,
  CreatePostRequest,
  PostItem,
  PostListResponse,
  PostQueryRequest,
  ToggleLikeResponse,
} from "@/types/post";

export const postService = {
  // Lấy danh sách bài viết (theo classCode hoặc userId)
  async getPosts(params: PostQueryRequest = {}): Promise<PostListResponse> {
    const response = await api.get<PostListResponse>("/posts", { params });
    return response.data;
  },

  // Tạo bài viết mới
  async createPost(data: CreatePostRequest): Promise<PostItem> {
    const response = await api.post<PostItem>("/posts", data);
    return response.data;
  },

  // Xóa bài viết
  async deletePost(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/posts/${id}`);
    return response.data;
  },

  // Lấy bình luận của bài viết
  async getComments(postId: number): Promise<PostItem[]> {
    const response = await api.get<PostItem[]>(`/posts/${postId}/comments`);
    return response.data;
  },

  // Thêm bình luận
  async addComment(postId: number, data: CreateCommentRequest): Promise<PostItem> {
    const response = await api.post<PostItem>(`/posts/${postId}/comments`, data);
    return response.data;
  },

  // Like / Unlike bài viết
  async toggleLike(postId: number): Promise<ToggleLikeResponse> {
    const response = await api.post<ToggleLikeResponse>(`/posts/${postId}/like`);
    return response.data;
  },
};
