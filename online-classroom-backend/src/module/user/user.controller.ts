import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ChangePasswordDto, UpdateProfileDto } from './dto/user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly usersService: UserService) {}

  /**
   * GET /users/me — Lấy thông tin user đang đăng nhập
   */
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  /**
   * PATCH /users/profile — Cập nhật thông tin tài khoản
   */
  @Patch('profile')
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  /**
   * POST /users/change-password — Đổi mật khẩu
   */
  @Post('change-password')
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, dto);
  }

  /**
   * GET /users/teachers — Lấy danh sách tất cả giáo viên
   */
  @Get('teachers')
  getTeachers() {
    return this.usersService.getTeachers();
  }
}
