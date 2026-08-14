import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import {
  CreateMeetingScheduleDto,
  CreateScheduleDto,
  UpdateScheduleDto,
} from './dto/schedule.dto';

@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  /**
   * GET /schedule — Lấy danh sách lịch học của user (học sinh / giáo viên)
   */
  @Get()
  getUserSchedules(
    @CurrentUser() user: AuthenticatedUser,
    @Query('classCode') classCode?: string,
  ) {
    return this.scheduleService.getUserSchedules(user.id, user.role, classCode);
  }

  /**
   * GET /schedule/upcoming-meeting — Lấy cuộc họp trực tuyến sắp tới gần nhất
   */
  @Get('upcoming-meeting')
  getUpcomingMeeting(@CurrentUser() user: AuthenticatedUser) {
    return this.scheduleService.getUpcomingMeeting(user.id, user.role);
  }

  /**
   * GET /schedule/meeting/:meetingId — Lấy event theo meetingId
   */
  @Get('meeting/:meetingId')
  getEventByMeetingId(@Param('meetingId') meetingId: string) {
    return this.scheduleService.getEventByMeetingId(meetingId);
  }

  /**
   * GET /schedule/recurrence-check/:id — Kiểm tra chuỗi lặp lại
   */
  @Get('recurrence-check/:id')
  checkRecurrenceGroup(@Param('id', ParseIntPipe) id: number) {
    return this.scheduleService.checkRecurrenceGroup(id);
  }

  /**
   * POST /schedule — Tạo lịch học mới
   */
  @Post()
  createSchedule(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.scheduleService.createSchedule(user.id, dto);
  }

  /**
   * POST /schedule/meeting — Tạo lịch cuộc họp trực tuyến
   */
  @Post('meeting')
  createMeetingSchedule(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMeetingScheduleDto,
  ) {
    return this.scheduleService.createMeetingSchedule(user.id, dto);
  }

  /**
   * PATCH /schedule/:id — Sửa 1 buổi học
   */
  @Patch(':id')
  updateSingleEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.scheduleService.updateSingleEvent(user.id, id, dto);
  }

  /**
   * PATCH /schedule/:id/recurrence — Sửa tất cả các buổi học trong chuỗi lặp lại
   */
  @Patch(':id/recurrence')
  updateAllRecurrenceEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.scheduleService.updateAllRecurrenceEvents(user.id, id, dto);
  }

  /**
   * DELETE /schedule/:id — Xóa 1 buổi học
   */
  @Delete(':id')
  deleteSingleEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.scheduleService.deleteSingleEvent(user.id, id);
  }

  /**
   * DELETE /schedule/:id/recurrence — Xóa tất cả các buổi học trong chuỗi lặp lại
   */
  @Delete(':id/recurrence')
  deleteAllRecurrenceEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.scheduleService.deleteAllRecurrenceEvents(user.id, id);
  }
}
