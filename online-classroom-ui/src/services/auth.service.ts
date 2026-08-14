import { api } from '@/lib/api';
import { SignupRequest, LoginRequest, AuthData, UserProfile } from '@/types/auth';

export const authService = {

  // Đăng ký
  // Trả về AuthData (đã unwrap bởi interceptor)
  async signup(data: SignupRequest): Promise<AuthData> {
    const response = await api.post<AuthData>('/auth/signup', data);
    return response.data;
  },

  // Đăng nhập
  // Trả về AuthData (đã unwrap bởi interceptor)
  async login(data: LoginRequest): Promise<AuthData> {
    const response = await api.post<AuthData>('/auth/login', data);
    return response.data;
  },

  // Đăng xuất — BE xóa cookie, không cần FE tự xử lý cookie
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  // Lấy thông tin user đang đăng nhập
  // Trả về UserProfile (đã unwrap bởi interceptor)
  async getProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/users/me');
    return response.data;
  },

  // Gửi lại email xác thực
  async resendVerification(): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>('/auth/resend-verification');
    return response.data;
  },

  // Xác thực token email
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>('/auth/verify-email', { token });
    return response.data;
  },
};