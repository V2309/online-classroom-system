import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';
import { ChangePasswordDto, UpdateProfileDto } from './dto/user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy thông tin profile của user hiện tại
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        birthday: true,
        address: true,
        schoolname: true,
        class_name: true,
        img: true,
        isBanned: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        plan: true,
        planExpiresAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại.');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Tài khoản đã bị khóa.');
    }

    return user;
  }

  /**
   * Cập nhật thông tin profile
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    const dataToUpdate: any = {};

    if (dto.username || dto.name) {
      dataToUpdate.username = (dto.username || dto.name)!.trim();
    }
    if (dto.phone !== undefined) {
      dataToUpdate.phone = dto.phone ? dto.phone.trim() : null;
    }
    if (dto.email !== undefined) {
      const email = dto.email ? dto.email.trim() : null;
      if (email && email !== user.email) {
        const existing = await this.prisma.user.findUnique({
          where: { email },
        });
        if (existing) {
          throw new BadRequestException(
            'Email này đã được sử dụng bởi tài khoản khác.',
          );
        }
      }
      dataToUpdate.email = email;
    }
    if (dto.schoolname !== undefined) {
      dataToUpdate.schoolname = dto.schoolname ? dto.schoolname.trim() : null;
    }
    if (dto.address !== undefined) {
      dataToUpdate.address = dto.address ? dto.address.trim() : null;
    }
    if (dto.img !== undefined) {
      dataToUpdate.img = dto.img;
    }
    if (dto.birthday !== undefined) {
      dataToUpdate.birthday = dto.birthday ? new Date(dto.birthday) : null;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        birthday: true,
        address: true,
        schoolname: true,
        class_name: true,
        img: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        plan: true,
        planExpiresAt: true,
        createdAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Đổi mật khẩu
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Đổi mật khẩu thành công.' };
  }

  /**
   * Lấy danh sách tất cả giáo viên (chỉ lấy id và username)
   */
  async getTeachers() {
    const teachers = await this.prisma.teacher.findMany({
      select: {
        id: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    });
    return teachers.map((t) => ({
      id: t.id,
      username: t.user.username,
    }));
  }
}
