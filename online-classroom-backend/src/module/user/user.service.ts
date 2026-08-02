import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Người dùng không tồn tại.',
      );
    }

    if (user.isBanned) {
      throw new UnauthorizedException(
        'Tài khoản đã bị khóa.',
      );
    }

    return user;
  }
}