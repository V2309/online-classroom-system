import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import {
  CreateGroupDto,
  SetGroupLeaderDto,
  UpdateGroupDto,
  UpdateGroupMemberDto,
} from './dto/group.dto';

@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  // ─── GET /groups/class/:classCode — Lấy danh sách nhóm của lớp ───────────
  @Get('class/:classCode')
  getClassGroups(
    @Param('classCode') classCode: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.groupService.getClassGroups(classCode, user.id, user.role);
  }

  // ─── POST /groups — Tạo nhóm mới (teacher only) ──────────────────────────
  @Post()
  @Roles('teacher')
  createGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateGroupDto,
  ) {
    return this.groupService.createGroup(user.id, dto);
  }

  // ─── POST /groups/members — Kéo thả cập nhật thành viên ───────────────────
  @Post('members')
  @Roles('teacher')
  @HttpCode(200)
  updateGroupMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateGroupMemberDto,
  ) {
    return this.groupService.updateGroupMembers(user.id, dto);
  }

  // ─── POST /groups/:id/leader — Đặt nhóm trưởng ───────────────────────────
  @Post(':id/leader')
  @Roles('teacher')
  @HttpCode(200)
  setGroupLeader(
    @Param('id') groupId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetGroupLeaderDto,
  ) {
    return this.groupService.setGroupLeader(groupId, user.id, dto);
  }

  // ─── PATCH /groups/:id — Cập nhật thông tin nhóm ─────────────────────────
  @Patch(':id')
  @Roles('teacher')
  updateGroup(
    @Param('id') groupId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupService.updateGroup(groupId, user.id, dto);
  }

  // ─── DELETE /groups/:id — Xóa nhóm ───────────────────────────────────────
  @Delete(':id')
  @Roles('teacher')
  deleteGroup(
    @Param('id') groupId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.groupService.deleteGroup(groupId, user.id);
  }
}
