import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import * as crypto from 'crypto';
import { UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../../lib/database/prisma.service';
import { MailService } from '../mail/mail.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './strategies/jwt.strategy';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult extends AuthTokens {
  user: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mailService: MailService,
  ) { }

  /**
   * Gửi lại email xác thực cho user đang đăng nhập
   */
  async resendVerification(userId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, isEmailVerified: true },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    if (!user.email) {
      throw new BadRequestException('Tài khoản chưa cập nhật địa chỉ email.');
    }

    if (user.isEmailVerified) {
      return { success: true, message: 'Email này đã được xác thực trước đó.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ

    // Xóa token cũ của user nếu có
    await this.prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Tạo token mới
    await this.prisma.verificationToken.create({
      data: {
        token,
        expires,
        userId: user.id,
      },
    });

    // Gửi email qua MailService
    await this.mailService.sendVerificationEmail(user.email, user.username, token);

    return { success: true, message: 'Đã gửi email xác thực thành công!' };
  }

  /**
   * Xác thực token email
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    if (!token) {
      throw new BadRequestException('Token xác thực không được để trống.');
    }

    const tokenRecord = await this.prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Mã xác thực không hợp lệ hoặc đã được sử dụng.');
    }

    if (tokenRecord.expires < new Date()) {
      await this.prisma.verificationToken.deleteMany({ where: { id: tokenRecord.id } });
      throw new BadRequestException('Mã xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email mới.');
    }

    // Cập nhật trạng thái xác thực của user và xóa token
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: tokenRecord.userId },
        data: {
          isEmailVerified: true,
          emailVerified: true,
        },
      }),
      this.prisma.verificationToken.deleteMany({
        where: { id: tokenRecord.id },
      }),
    ]);

    return { success: true, message: 'Xác thực email thành công!' };
  }

  async signup(dto: SignupDto): Promise<AuthResult> {
    await this.ensureUniqueIdentity(dto.email, dto.phone);

    const hashedPassword = await hash(dto.password, 10);
    const birthday = new Date(dto.birthday);

    const user = await this.prisma.$transaction(async (tx) => {
      // 1. Lưu toàn bộ thông tin cá nhân vào bảng User
      const createdUser = await tx.user.create({
        data: {
          username: dto.username,
          class_name: dto.class_name,
          schoolname: dto.schoolname,
          birthday,
          address: dto.address,
          img: dto.img,
          email: dto.email,
          phone: dto.phone,
          role: dto.role,
          password: hashedPassword,
        },
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          role: true,
        },
      });

      // 2. Chỉ liên kết userId cho các bảng con
      const profileData = {
        userId: createdUser.id,
      };

      if (dto.role === UserRole.student) {
        await tx.student.create({ data: profileData });
      }

      if (dto.role === UserRole.teacher) {
        await tx.teacher.create({ data: profileData });
      }

      return createdUser;
    });

    return this.buildAuthResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.email }] },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        password: true,
        isBanned: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại.');
    }

    if (user.isBanned) {
      throw new ForbiddenException('Tài khoản đã bị khóa.');
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'Tài khoản này đăng nhập bằng Google. Vui lòng dùng nút đăng nhập Google.',
      );
    }

    const isMatch = await compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu không đúng.');
    }

    return this.buildAuthResult(user);
  }

  async getProfile(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isBanned: true,
      },
    });

    if (!user || user.isBanned) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ.');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isBanned: true,
        hashedRefreshToken: true,
      },
    });

    if (!user || user.isBanned || !user.hashedRefreshToken) {
      throw new ForbiddenException('Truy cập bị từ chối.');
    }

    const isMatch = await compare(refreshToken, user.hashedRefreshToken);
    if (!isMatch) {
      throw new ForbiddenException('Truy cập bị từ chối.');
    }

    return this.buildAuthResult(user);
  }

  async logout(userId: string): Promise<void> {
    await this.updateRefreshToken(userId, null);
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    const hashedRefreshToken = refreshToken ? await hash(refreshToken, 10) : null;
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  private async ensureUniqueIdentity(email?: string, phone?: string) {
    if (!email && !phone) {
      throw new ConflictException('Email hoặc số điện thoại phải được cung cấp.');
    }

    if (email) {
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) throw new ConflictException('Email đã được sử dụng.');
    }

    if (phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone } });
      if (existing)
        throw new ConflictException('Số điện thoại đã được sử dụng.');
    }
  }

  private async buildAuthResult(user: AuthenticatedUser): Promise<AuthResult> {
    const tokens = await this.signTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  private async signTokens(user: AuthenticatedUser): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: user.id, username: user.username, role: user.role },
        { expiresIn: '7d' },
      ),
      this.jwt.signAsync(
        { sub: user.id },
        { expiresIn: '30d' },
      ),
    ]);

    return { accessToken, refreshToken, expiresIn: 7 * 24 * 3600 };
  }
}

