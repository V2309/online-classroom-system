export interface PostUser {
  id: string;
  username: string;
  img?: string | null;
  role: string;
}

export interface PostItem {
  id: number;
  createdAt: string;
  updatedAt: string;
  desc?: string | null;
  img?: string | null;
  imgHeight?: number | null;
  video?: string | null;
  isSensitive: boolean;
  userId: string;
  user: PostUser;
  classCode?: string | null;
  parentPostId?: number | null;
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
}

export interface CreatePostRequest {
  desc?: string;
  img?: string;
  imgHeight?: number;
  video?: string;
  classCode?: string;
  parentPostId?: number;
}

export interface CreateCommentRequest {
  desc: string;
}

export interface PostQueryRequest {
  classCode?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface PostListResponse {
  data: PostItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ToggleLikeResponse {
  isLiked: boolean;
  likesCount: number;
}
