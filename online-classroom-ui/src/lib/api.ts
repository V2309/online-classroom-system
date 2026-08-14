import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,

  // Cho phép browser gửi cookie (session, refreshToken) theo mỗi request
  withCredentials: true,

  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Response Interceptor ────────────────────────────────────────────────────
// 1. Unwrap response: BE luôn trả { statusCode, message, data: T }
//    → interceptor tự unwrap thành T để service/component không cần `.data.data`
// 2. Auto-refresh: nếu access token hết hạn (401) → gọi /auth/refresh một lần
//    rồi retry request gốc. Nếu refresh cũng fail → redirect về /sign-in.
// ─────────────────────────────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => {
    // Unwrap { statusCode, message, data } → chỉ giữ data
    if (
      response.data &&
      typeof response.data === 'object' &&
      'data' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    // Chỉ thử refresh khi: lỗi 401, chưa retry, và không phải chính endpoint refresh/login
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/login');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        // Gọi refresh — BE sẽ set cookie `session` mới qua Set-Cookie
        await api.post('/auth/refresh');
        // Retry request gốc với cookie mới
        return api(originalRequest);
      } catch {
        // Refresh fail → đẩy về trang login
        if (typeof window !== 'undefined') {
          window.location.href = '/sign-in';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);