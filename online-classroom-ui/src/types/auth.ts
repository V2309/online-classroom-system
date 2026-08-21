// ─── Request types ────────────────────────────────────────────────────────────

export interface SignupRequest {
  username: string;
  class_name: string;
  schoolname: string;
  birthday: string;
  address: string;
  email?: string;
  phone?: string;
  role: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ─── User / Profile types ─────────────────────────────────────────────────────

/**
 * Thông tin user trả về từ GET /users/me
 * Sau khi interceptor unwrap { statusCode, message, data } → UserProfile
 */
export interface UserProfile {
  id: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  role: 'teacher' | 'student' | 'admin' | string;
  birthday?: string | null;
  address?: string | null;
  schoolname?: string | null;
  class_name?: string | null;
  img?: string | null;
  createdAt?: string;
  isEmailVerified?: boolean;
  plan?: 'FREE' | 'PRO' | 'PREMIUM';
  planExpiresAt?: string | null;
}

export interface UpdateProfileRequest {
  username?: string;
  name?: string;
  phone?: string;
  email?: string;
  schoolname?: string;
  address?: string;
  birthday?: string;
  img?: string;
}

// ─── Auth response types ──────────────────────────────────────────────────────

/**
 * Payload bên trong `data` sau khi unwrap từ POST /auth/login hoặc /auth/signup
 * Tức là: BE trả { statusCode, message, data: AuthData }
 *         interceptor unwrap → service nhận AuthData trực tiếp
 */
export interface AuthData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfile;
}

// ─── Legacy / deprecated ─────────────────────────────────────────────────────

/** @deprecated Dùng UserProfile thay thế */
export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string | null;
  role: string;
  birthday?: string | null;
  address?: string | null;
  schoolname?: string | null;
  img?: string | null;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
}

/** @deprecated Dùng AuthData thay thế (sau khi đã có interceptor unwrap) */
export interface AuthResponse {
  statusCode: number;
  message: string;
  data: {
    accessToken: string;
    expiresIn: number;
    user: User;
  };
}

export interface ProfileData {
  username: string;
  phoneNumber: string;
  isPhoneVerified: boolean;
  email: string;
  isEmailVerified: boolean;
  password?: string;
  facebookLinked: boolean;
  name: string;
  dateOfBirth: string;
  dateOfBirthValue: string;
  province: string;
  school: string;
  role: string;
  avatar?: string;
}