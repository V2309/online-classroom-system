import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClassService } from './class.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CreateClassDto, UpdateClassDto, ClassQueryDto, ClassMembersQueryDto } from './dto/class.dto';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassController {
  constructor(private readonly classService: ClassService) { }

  // ─── GET /classes — danh sách lớp theo role ───────────────────────────────
  @Get()
  getClasses(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ClassQueryDto,
  ) {
    return this.classService.getClasses(user.id, user.role, query);
  }

  // ─── GET /classes/deleted — lớp đã xóa (teacher only) ────────────────────
  @Get('deleted')
  @Roles('teacher')
  getDeletedClasses(@CurrentUser() user: AuthenticatedUser) {
    return this.classService.getDeletedClasses(user.id);
  }

  // ─── GET /classes/grades — danh sách khối lớp ───────────────────────────────
  @Get('grades')
  getGrades() {
    return this.classService.getGrades();
  }

  // ─── GET /classes/:code/members — danh sách thành viên của lớp ────────────
  @Get(':code/members')
  getClassMembers(
    @Param('code') classCode: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ClassMembersQueryDto,
  ) {
    return this.classService.getClassMembers(classCode, user.id, user.role, query);
  }

  // ─── DELETE /classes/:code/members/:studentId — xóa học sinh khỏi lớp ─────
  @Delete(':code/members/:studentId')
  @Roles('teacher')
  removeStudentFromClass(
    @Param('code') classCode: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classService.removeStudentFromClass(classCode, studentId, user.id);
  }

  // ─── GET /classes/:code ───────────────────────────────────────────────────
  @Get(':code')
  getClassByCode(
    @Param('code') classCode: string,
  ) {
    return this.classService.getClassByCode(classCode);
  }

  // ─── POST /classes — tạo lớp mới (teacher only) ──────────────────────────
  @Post()
  @Roles('teacher')
  createClass(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateClassDto,
  ) {
    return this.classService.createClass(user.id, dto);
  }

  // ─── PATCH /classes/:id — sửa lớp (teacher owner) ────────────────────────
  @Patch(':id')
  @Roles('teacher')
  updateClass(
    @Param('id', ParseIntPipe) classId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateClassDto,
  ) {
    return this.classService.updateClass(classId, user.id, dto);
  }

  // ─── DELETE /classes/:id — soft delete (teacher owner) ───────────────────
  @Delete(':id')
  @Roles('teacher')
  deleteClass(
    @Param('id', ParseIntPipe) classId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classService.deleteClass(classId, user.id);
  }

  // ─── POST /classes/:id/restore ────────────────────────────────────────────
  @Post(':id/restore')
  @Roles('teacher')
  @HttpCode(200)
  restoreClass(
    @Param('id', ParseIntPipe) classId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classService.restoreClass(classId, user.id);
  }

  // ─── POST /classes/:code/join — học sinh gửi yêu cầu vào lớp ────────────
  @Post(':code/join')
  @Roles('student')
  @HttpCode(200)
  joinClass(
    @Param('code') classCode: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classService.joinClass(classCode, user.id);
  }

  // ─── POST /classes/:id/leave — học sinh rời lớp ───────────────────────────
  @Post(':id/leave')
  @Roles('student')
  @HttpCode(200)
  leaveClass(
    @Param('id', ParseIntPipe) classId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classService.leaveClass(classId, user.id);
  }

  // ─── GET /classes/:id/join-requests — danh sách yêu cầu vào lớp ─────────
  @Get(':id/join-requests')
  @Roles('teacher')
  getJoinRequests(
    @Param('id', ParseIntPipe) classId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classService.getJoinRequests(classId, user.id);
  }

  // ─── POST /classes/join-requests/:requestId/approve ──────────────────────
  @Post('join-requests/:requestId/approve')
  @Roles('teacher')
  @HttpCode(200)
  approveJoinRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classService.approveJoinRequest(requestId, user.id);
  }

  // ─── POST /classes/join-requests/:requestId/reject ────────────────────────
  @Post('join-requests/:requestId/reject')
  @Roles('teacher')
  @HttpCode(200)
  rejectJoinRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classService.rejectJoinRequest(requestId, user.id);
  }
}

