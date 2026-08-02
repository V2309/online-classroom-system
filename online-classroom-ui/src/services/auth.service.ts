import { api } from '@/lib/api';

import {
  SignupRequest,
  LoginRequest,
  AuthResponse,
} from '@/types/auth';

export const authService = {

  // Đăng ký
  async signup(
    data: SignupRequest,
  ): Promise<AuthResponse> {

    const response = await api.post<AuthResponse>(
      '/auth/signup',
      data,
    );

    return response.data;
  },


  // Đăng nhập
  async login(
    data: LoginRequest,
  ): Promise<AuthResponse> {

    const response = await api.post<AuthResponse>(
      '/auth/login',
      data,
    );

    return response.data;
  },


  // Đăng xuất
  async logout() {

    const response = await api.post(
      '/auth/logout',
    );

  // profile người dùng hiện tại
  
    return response.data;
  },
  // Lấy thông tin profile người dùng hiện tại
  async getProfile() {
    const response = await api.get<AuthResponse>(
      '/users/me',
    );
    return response.data;
  },
};