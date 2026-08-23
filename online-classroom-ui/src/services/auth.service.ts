import { api } from '@/lib/api';
import { SignupRequest, LoginRequest, AuthData, UserProfile } from '@/types/auth';

export const authService = {

  // Đăng ký
  // Trả về AuthData (đã unwrap bởi interceptor)
  async signup(data: SignupRequest): Promise<AuthData> {
    const response = await api.post<AuthData>('/auth/signup', data);
    const authData = response.data;
    if (authData?.accessToken) {
      try {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: authData.accessToken }),
        });
      } catch (err) {
        console.error('Failed to sync session cookie:', err);
      }
    }
    return authData;
  },

  // Đăng nhập
  // Trả về AuthData (đã unwrap bởi interceptor)
  async login(data: LoginRequest): Promise<AuthData> {
    const response = await api.post<AuthData>('/auth/login', data);
    const authData = response.data;
    if (authData?.accessToken) {
      try {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: authData.accessToken }),
        });
      } catch (err) {
        console.error('Failed to sync session cookie:', err);
      }
    }
    return authData;
  },

  // Đăng nhập / Đăng ký với Google
  // Trả về AuthData (đã unwrap bởi interceptor)
  async googleLogin(idToken: string, role?: string): Promise<AuthData> {
    const response = await api.post<AuthData>('/auth/google', {
      idToken,
      ...(role ? { role } : {}),
    });
    const authData = response.data;
    if (authData?.accessToken) {
      try {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: authData.accessToken }),
        });
      } catch (err) {
        console.error('Failed to sync session cookie:', err);
      }
    }
    return authData;
  },

  // Đăng xuất — BE xóa cookie và FE xóa session cookie
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Bỏ qua lỗi BE nếu có khi logout
    } finally {
      try {
        await fetch('/api/auth/session', { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to clear session cookie:', err);
      }
    }
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