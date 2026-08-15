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
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { HomeworkService } from './homework.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import {
  UpdateHomeworkQuestionsDto,
  UpdateHomeworkSettingsDto,
} from './dto/update-homework.dto';
import {
  GradeSubmissionDto,
  SaveDraftDto,
  SubmitHomeworkDto,
} from './dto/submission.dto';
import {
  SubmissionDetailQueryDto,
  SubmissionsCountQueryDto,
} from './dto/homework-query.dto';

@Controller('homework')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  // ─── POST /homework — Tạo bài tập mới (Teacher) ──────────────────────────
  @Post()
  @Roles('teacher')
  createHomework(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHomeworkDto,
  ) {
    return this.homeworkService.createHomework(user.id, dto);
  }

  // ─── GET /homework/submissions/count — Đếm số lượt làm & điểm tốt nhất ───
  @Get('submissions/count')
  @Roles('student')
  getSubmissionsCount(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SubmissionsCountQueryDto,
  ) {
    return this.homeworkService.getSubmissionsCount(
      parseInt(query.homeworkId, 10),
      user.id,
    );
  }

  // ─── GET /homework/submissions/detail — Chi tiết bài làm ──────────────────
  @Get('submissions/detail')
  getSubmissionDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SubmissionDetailQueryDto,
  ) {
    return this.homeworkService.getSubmissionDetail(query, user.id, user.role);
  }

  // ─── GET /homework/class/:classCode — Danh sách bài tập của lớp ──────────
  @Get('class/:classCode')
  getClassHomeworks(
    @Param('classCode') classCode: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.homeworkService.getClassHomeworks(
      classCode,
      user.id,
      user.role,
    );
  }

  // ─── GET /homework/class/:classCode/scoretable — Bảng điểm lớp học ──────
  @Get('class/:classCode/scoretable')
  getScoreTable(
    @Param('classCode') classCode: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.homeworkService.getScoreTable(classCode, user.id, user.role);
  }

  // ─── GET /homework/student/overview — Tổng quan học tập của học sinh ─────
  @Get('student/overview')
  @Roles('student')
  getStudentOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.homeworkService.getStudentOverview(user.id);
  }

  // ─── GET /homework/:id — Chi tiết bài tập ─────────────────────────────────
  @Get(':id')
  getHomeworkById(
    @Param('id', ParseIntPipe) homeworkId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.homeworkService.getHomeworkById(homeworkId, user.id, user.role);
  }

  // ─── GET /homework/:id/teacher-detail — Xem bài nộp của lớp (Teacher) ─────
  @Get(':id/teacher-detail')
  @Roles('teacher')
  getTeacherDetail(
    @Param('id', ParseIntPipe) homeworkId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.homeworkService.getTeacherDetail(homeworkId, user.id);
  }

  // ─── GET /homework/:id/download — Thông tin tải file đề bài ───────────────
  @Get(':id/download')
  getDownloadInfo(
    @Param('id', ParseIntPipe) homeworkId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.homeworkService.getDownloadInfo(homeworkId, user.id, user.role);
  }

  // ─── GET /homework/:id/export — Xuất danh sách nộp bài ra Excel ───────────
  @Get(':id/export')
  @Roles('teacher')
  exportSubmissions(
    @Param('id', ParseIntPipe) homeworkId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    return this.homeworkService.exportSubmissions(homeworkId, user.id, res);
  }

  // ─── PATCH /homework/:id/questions — Cập nhật câu hỏi (Teacher) ───────────
  @Patch(':id/questions')
  @Roles('teacher')
  updateHomeworkQuestions(
    @Param('id', ParseIntPipe) homeworkId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateHomeworkQuestionsDto,
  ) {
    return this.homeworkService.updateHomeworkQuestions(
      homeworkId,
      user.id,
      dto,
    );
  }

  // ─── PATCH /homework/:id/settings — Cập nhật cài đặt (Teacher) ────────────
  @Patch(':id/settings')
  @Roles('teacher')
  updateHomeworkSettings(
    @Param('id', ParseIntPipe) homeworkId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateHomeworkSettingsDto,
  ) {
    return this.homeworkService.updateHomeworkSettings(
      homeworkId,
      user.id,
      dto,
    );
  }

  // ─── DELETE /homework/:id — Xóa bài tập (Teacher) ─────────────────────────
  @Delete(':id')
  @Roles('teacher')
  deleteHomework(
    @Param('id', ParseIntPipe) homeworkId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.homeworkService.deleteHomework(homeworkId, user.id);
  }

  // ─── POST /homework/:id/save — Lưu nháp bài làm (Student) ─────────────────
  @Post(':id/save')
  @Roles('student')
  saveDraft(
    @Param('id', ParseIntPipe) homeworkId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SaveDraftDto,
  ) {
    return this.homeworkService.saveDraft(homeworkId, user.id, dto);
  }

  // ─── POST /homework/:id/submit — Nộp bài / Làm thử ────────────────────────
  @Post(':id/submit')
  submitHomework(
    @Param('id', ParseIntPipe) homeworkId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitHomeworkDto,
  ) {
    return this.homeworkService.submitHomework(
      homeworkId,
      user.id,
      user.role,
      dto,
    );
  }

  // ─── POST /homework/:id/grade — Chấm điểm bài nộp (Teacher) ───────────────
  @Post(':id/grade')
  @Roles('teacher')
  gradeSubmission(
    @Param('id', ParseIntPipe) homeworkId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.homeworkService.gradeSubmission(homeworkId, user.id, dto);
  }
}
