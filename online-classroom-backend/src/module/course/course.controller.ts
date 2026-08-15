import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import {
  CourseQueryDto,
  CreateCourseDto,
  CreateFolderDto,
  MoveCourseDto,
  UpdateCourseDto,
  UpdateFolderDto,
} from './dto/course.dto';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  // ─── GET /courses/class/:classCode — Lấy danh sách khóa học của lớp ─────
  @Get('class/:classCode')
  getClassCourses(
    @Param('classCode') classCode: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CourseQueryDto,
  ) {
    return this.courseService.getClassCourses(
      classCode,
      user.id,
      user.role,
      query,
    );
  }

  // ─── GET /courses/class/:classCode/folders — Lấy danh sách folder ────────
  @Get('class/:classCode/folders')
  getClassFolders(
    @Param('classCode') classCode: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.courseService.getClassFolders(classCode, user.id, user.role);
  }

  // ─── GET /courses/:id — Lấy chi tiết khóa học ────────────────────────────
  @Get(':id')
  getCourseById(
    @Param('id') courseId: string,
    @Query('classCode') classCode: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.courseService.getCourseById(
      courseId,
      classCode,
      user.id,
      user.role,
    );
  }

  // ─── POST /courses — Tạo khóa học mới (Teacher) ──────────────────────────
  @Post()
  @Roles('teacher')
  createCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCourseDto,
  ) {
    return this.courseService.createCourse(user.id, dto);
  }

  // ─── PATCH /courses/:id — Cập nhật khóa học (Teacher) ────────────────────
  @Patch(':id')
  @Roles('teacher')
  updateCourse(
    @Param('id') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.courseService.updateCourse(courseId, user.id, dto);
  }

  // ─── DELETE /courses/:id — Xóa khóa học (Teacher) ────────────────────────
  @Delete(':id')
  @Roles('teacher')
  deleteCourse(
    @Param('id') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.courseService.deleteCourse(courseId, user.id);
  }

  // ─── POST /courses/:id/move — Di chuyển khóa học (Teacher) ───────────────
  @Post(':id/move')
  @Roles('teacher')
  @HttpCode(200)
  moveCourseToFolder(
    @Param('id') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MoveCourseDto,
  ) {
    return this.courseService.moveCourseToFolder(courseId, user.id, dto);
  }

  // ─── POST /courses/folders — Tạo folder mới (Teacher) ────────────────────
  @Post('folders')
  @Roles('teacher')
  createFolder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFolderDto,
  ) {
    return this.courseService.createFolder(user.id, dto);
  }

  // ─── PATCH /courses/folders/:id — Sửa folder (Teacher) ───────────────────
  @Patch('folders/:id')
  @Roles('teacher')
  updateFolder(
    @Param('id') folderId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.courseService.updateFolder(folderId, user.id, dto);
  }

  // ─── DELETE /courses/folders/:id — Xóa folder (Teacher) ──────────────────
  @Delete('folders/:id')
  @Roles('teacher')
  deleteFolder(
    @Param('id') folderId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.courseService.deleteFolder(folderId, user.id);
  }
}
