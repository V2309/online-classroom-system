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

export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string | null; // Thêm phone để khớp với JSON (có thể null)
  role: string;
  birthday?: string | null;
  address?: string | null;
  schoolname?: string | null;
  img?: string | null;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
}

export interface AuthResponse {
  statusCode: number;
  message: string;
  data: {
    accessToken: string; // Bổ sung token để lưu vào cookie
    expiresIn: number;   // Bổ sung thời gian hết hạn
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