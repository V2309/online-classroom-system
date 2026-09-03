import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../../lib/database/prisma.service';
import { MailService } from '../mail/mail.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

// Mock toàn bộ bcryptjs để control compare/hash trong tests
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcryptjs from 'bcryptjs';
const mockCompare = bcryptjs.compare as jest.MockedFunction<
  typeof bcryptjs.compare
>;
const mockHash = bcryptjs.hash as jest.MockedFunction<typeof bcryptjs.hash>;

// ─── Mock data ───────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-id-1',
  username: 'testuser',
  email: 'test@example.com',
  phone: null as string | null,
  img: null as string | null,
  role: UserRole.student,
  isBanned: false,
  password: 'hashed_password',
  hashedRefreshToken: null as string | null,
  isEmailVerified: false,
  emailVerified: false,
  googleId: null as string | null,
};

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    student: { create: jest.fn() },
    teacher: { create: jest.fn() },
    verificationToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock_jwt_token'),
  };

  const mockMailService = {
    sendVerificationEmail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('mock_google_client_id'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
    mockJwtService.signAsync.mockResolvedValue('mock_jwt_token');
    mockConfigService.get.mockReturnValue('mock_google_client_id');
    mockPrismaService.user.update.mockResolvedValue(mockUser);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // signup()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('signup()', () => {
    const signupDto: SignupDto = {
      username: 'testuser',
      email: 'test@example.com',
      phone: undefined,
      password: 'Password123',
      role: UserRole.student,
      class_name: '10A1',
      schoolname: 'THPT Test',
      birthday: '2000-01-01',
      address: 'HCM',
    };

    it('đăng ký thành công với role student → trả về AuthResult có accessToken', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation((cb: any) =>
        cb({
          user: { create: jest.fn().mockResolvedValue(mockUser) },
          student: { create: jest.fn().mockResolvedValue({}) },
          teacher: { create: jest.fn() },
        }),
      );

      const result = await service.signup(signupDto);

      expect(result).toHaveProperty('accessToken', 'mock_jwt_token');
      expect(result).toHaveProperty('refreshToken', 'mock_jwt_token');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('đăng ký thành công với role teacher → tạo bản ghi teacher', async () => {
      const teacherDto = { ...signupDto, role: UserRole.teacher };
      const teacherUser = { ...mockUser, role: UserRole.teacher };
      const mockTeacherCreate = jest.fn().mockResolvedValue({});

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation((cb: any) =>
        cb({
          user: { create: jest.fn().mockResolvedValue(teacherUser) },
          student: { create: jest.fn() },
          teacher: { create: mockTeacherCreate },
        }),
      );

      const result = await service.signup(teacherDto);

      expect(result.user.role).toBe(UserRole.teacher);
      expect(mockTeacherCreate).toHaveBeenCalledWith({
        data: { userId: teacherUser.id },
      });
    });

    it('throw ConflictException khi email đã tồn tại', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.signup(signupDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.signup(signupDto)).rejects.toThrow(
        'Email đã được sử dụng.',
      );
    });

    it('throw ConflictException khi số điện thoại đã tồn tại', async () => {
      const phoneDto: SignupDto = {
        ...signupDto,
        email: undefined,
        phone: '0909090909',
      };
      // phone check → tồn tại
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.signup(phoneDto)).rejects.toThrow(ConflictException);
      await expect(service.signup(phoneDto)).rejects.toThrow(
        'Số điện thoại đã được sử dụng.',
      );
    });

    it('throw ConflictException khi không cung cấp email lẫn phone', async () => {
      const noContactDto: SignupDto = {
        ...signupDto,
        email: undefined,
        phone: undefined,
      };

      await expect(service.signup(noContactDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // login()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('login()', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123',
    };

    it('đăng nhập thành công với email + password đúng → trả về AuthResult', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        password: 'hashed',
      });
      mockCompare.mockResolvedValue(true as never);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('throw UnauthorizedException khi user không tồn tại', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Tài khoản không tồn tại.',
      );
    });

    it('throw ForbiddenException khi tài khoản bị khóa', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        isBanned: true,
      });

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
      await expect(service.login(loginDto)).rejects.toThrow(
        'Tài khoản đã bị khóa.',
      );
    });

    it('throw UnauthorizedException khi tài khoản Google (không có password)', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        password: null,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Tài khoản này đăng nhập bằng Google.',
      );
    });

    it('throw UnauthorizedException khi sai mật khẩu', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        password: 'hashed',
      });
      mockCompare.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Mật khẩu không đúng.',
      );
    });

    it('đăng nhập bằng số điện thoại thành công', async () => {
      const phoneLoginDto: LoginDto = {
        email: '0909090909',
        password: 'Password123',
      };
      const userWithPhone = {
        ...mockUser,
        email: null,
        phone: '0909090909',
        password: 'hashed',
      };
      mockPrismaService.user.findFirst.mockResolvedValue(userWithPhone);
      mockCompare.mockResolvedValue(true as never);

      const result = await service.login(phoneLoginDto);

      expect(result).toHaveProperty('accessToken');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // verifyEmail()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('verifyEmail()', () => {
    const validToken = 'valid_token_abc123';

    it('xác thực email thành công với token hợp lệ', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000);
      mockPrismaService.verificationToken.findUnique.mockResolvedValue({
        id: 1,
        token: validToken,
        expires: futureDate,
        userId: mockUser.id,
        user: mockUser,
      });
      mockPrismaService.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.verifyEmail(validToken);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Xác thực email thành công!');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('throw BadRequestException khi token là chuỗi rỗng', async () => {
      await expect(service.verifyEmail('')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmail('')).rejects.toThrow(
        'Token xác thực không được để trống.',
      );
    });

    it('throw BadRequestException khi token không tồn tại trong DB', async () => {
      mockPrismaService.verificationToken.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail('nonexistent')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmail('nonexistent')).rejects.toThrow(
        'Mã xác thực không hợp lệ hoặc đã được sử dụng.',
      );
    });

    it('throw BadRequestException và xóa token khi đã hết hạn', async () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      mockPrismaService.verificationToken.findUnique.mockResolvedValue({
        id: 1,
        token: validToken,
        expires: pastDate,
        userId: mockUser.id,
        user: mockUser,
      });
      mockPrismaService.verificationToken.deleteMany.mockResolvedValue({
        count: 1,
      });

      await expect(service.verifyEmail(validToken)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmail(validToken)).rejects.toThrow(
        'Mã xác thực đã hết hạn.',
      );

      expect(mockPrismaService.verificationToken.deleteMany).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // resendVerification()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('resendVerification()', () => {
    it('gửi lại email xác thực thành công', async () => {
      const unverifiedUser = {
        ...mockUser,
        isEmailVerified: false,
        email: 'test@example.com',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(unverifiedUser);
      mockPrismaService.verificationToken.deleteMany.mockResolvedValue({
        count: 0,
      });
      mockPrismaService.verificationToken.create.mockResolvedValue({});
      mockMailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.resendVerification(mockUser.id);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Đã gửi email xác thực thành công!');
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalledWith(
        unverifiedUser.email,
        unverifiedUser.username,
        expect.any(String),
      );
    });

    it('trả về message "đã xác thực" nếu email đã verified', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isEmailVerified: true,
      });

      const result = await service.resendVerification(mockUser.id);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email này đã được xác thực trước đó.');
      expect(mockMailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('throw NotFoundException khi user không tồn tại', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.resendVerification('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.resendVerification('nonexistent')).rejects.toThrow(
        'Không tìm thấy người dùng.',
      );
    });

    it('throw BadRequestException khi user không có email', async () => {
      const noEmailUser = { ...mockUser, email: null, isEmailVerified: false };
      mockPrismaService.user.findUnique.mockResolvedValue(noEmailUser);

      await expect(service.resendVerification(mockUser.id)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resendVerification(mockUser.id)).rejects.toThrow(
        'Tài khoản chưa cập nhật địa chỉ email.',
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // refreshTokens()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('refreshTokens()', () => {
    it('cấp token mới khi refresh token hợp lệ', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        hashedRefreshToken: 'hashed_rt',
        isBanned: false,
      });
      mockCompare.mockResolvedValue(true as never);

      const result = await service.refreshTokens(
        mockUser.id,
        'raw_refresh_token',
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throw ForbiddenException khi user không tồn tại', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshTokens('nonexistent', 'token'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throw ForbiddenException khi user bị banned', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isBanned: true,
        hashedRefreshToken: 'hashed',
      });

      await expect(service.refreshTokens(mockUser.id, 'token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throw ForbiddenException khi hashedRefreshToken là null (user đã logout)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        hashedRefreshToken: null,
      });

      await expect(service.refreshTokens(mockUser.id, 'token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throw ForbiddenException khi refresh token không khớp hash', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        hashedRefreshToken: 'hashed_rt',
      });
      mockCompare.mockResolvedValue(false as never);

      await expect(
        service.refreshTokens(mockUser.id, 'wrong_token'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.refreshTokens(mockUser.id, 'wrong_token'),
      ).rejects.toThrow('Truy cập bị từ chối.');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // logout()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('đặt hashedRefreshToken về null khi logout', async () => {
      await service.logout(mockUser.id);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { hashedRefreshToken: null },
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getProfile()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('getProfile()', () => {
    it('trả về thông tin user hợp lệ', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile(mockUser.id);

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.role).toBe(UserRole.student);
    });

    it('throw UnauthorizedException khi user không tồn tại', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        'Phiên đăng nhập không hợp lệ.',
      );
    });

    it('throw UnauthorizedException khi user bị banned', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isBanned: true,
      });

      await expect(service.getProfile(mockUser.id)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // updateRefreshToken()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('updateRefreshToken()', () => {
    it('hash refresh token mới và lưu vào DB', async () => {
      mockHash.mockResolvedValue('hashed_new_token' as never);

      await service.updateRefreshToken(mockUser.id, 'new_refresh_token');

      expect(mockHash).toHaveBeenCalledWith('new_refresh_token', 10);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { hashedRefreshToken: 'hashed_new_token' },
      });
    });

    it('đặt hashedRefreshToken về null khi token là null', async () => {
      await service.updateRefreshToken(mockUser.id, null);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { hashedRefreshToken: null },
      });
    });
  });
});
