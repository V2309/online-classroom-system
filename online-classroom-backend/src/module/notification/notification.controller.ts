import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * GET /notifications — Lấy danh sách thông báo chưa đọc
   */
  @Get()
  getNotifications(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.getNotifications(user.id);
  }

  /**
   * POST /notifications — Đánh dấu tất cả là đã đọc
   */
  @Post()
  markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.markAllAsRead(user.id);
  }

  /**
   * PATCH /notifications/:id/read — Đánh dấu 1 thông báo là đã đọc
   */
  @Patch(':id/read')
  markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markAsRead(user.id, id);
  }
}
