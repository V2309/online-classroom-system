import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../../lib/database/prisma.service';
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
  ) {}

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
        { expiresIn: '15m' },
      ),
      this.jwt.signAsync(
        { sub: user.id },
        { expiresIn: '7d' },
      ),
    ]);

    return { accessToken, refreshToken, expiresIn: 900 };
  }
}

