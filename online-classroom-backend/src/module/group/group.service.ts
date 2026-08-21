import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';
import {
  CreateGroupDto,
  SetGroupLeaderDto,
  UpdateGroupDto,
  UpdateGroupMemberDto,
} from './dto/group.dto';

@Injectable()
export class GroupService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── GET /groups/class/:classCode — Lấy nhóm và học sinh của lớp ─────────
  async getClassGroups(classCode: string, userId: string, role: string) {
    const cls = await this.prisma.class.findUnique({
      where: { class_code: classCode, deleted: false },
      select: { id: true, name: true, supervisorId: true },
    });
    if (!cls) throw new NotFoundException('Lớp học không tồn tại.');

    if (role === 'teacher') {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });
      if (!teacher || cls.supervisorId !== teacher.id) {
        throw new ForbiddenException('Bạn không có quyền xem lớp này.');
      }
    } else if (role === 'student') {
      const student = await this.prisma.student.findUnique({
        where: { userId },
      });
      if (!student)
        throw new ForbiddenException('Không tìm thấy thông tin học sinh.');
      const isMember = await this.prisma.class.findFirst({
        where: { id: cls.id, students: { some: { id: student.id } } },
      });
      if (!isMember)
        throw new ForbiddenException('Bạn không thuộc lớp học này.');
    }

    // 1. Lấy tất cả học sinh trong lớp
    const allStudents = await this.prisma.student.findMany({
      where: {
        classes: {
          some: {
            class_code: classCode,
          },
        },
      },
      select: {
        id: true,
        user: {
          select: {
            username: true,
            img: true,
            class_name: true,
          },
        },
      },
    });

    // 2. Lấy danh sách nhóm
    const rawGroups = await this.prisma.classGroup.findMany({
      where: {
        classCode,
      },
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                user: {
                  select: {
                    username: true,
                    img: true,
                    class_name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        createdBy: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const groups = rawGroups.map((g) => ({
      id: g.id,
      name: g.name,
      color: g.color,
      maxSize: g.maxSize,
      classCode: g.classCode,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      createdById: g.createdById,
      createdBy: {
        id: g.createdBy.id,
        username: g.createdBy.user?.username,
      },
      members: g.members.map((m) => ({
        id: m.id,
        groupId: m.groupId,
        studentId: m.studentId,
        role: m.role,
        joinedAt: m.joinedAt,
        student: {
          id: m.student.id,
          username: m.student.user.username,
          img: m.student.user.img,
          class_name: m.student.user.class_name,
        },
      })),
    }));

    // 3. Tìm học sinh chưa có nhóm
    const studentsInGroups = new Set<string>();
    for (const g of groups) {
      for (const m of g.members) {
        studentsInGroups.add(m.student.id);
      }
    }

    const studentsWithoutGroup = allStudents
      .filter((s) => !studentsInGroups.has(s.id))
      .map((s) => ({
        id: s.id,
        username: s.user.username,
        img: s.user.img,
        class_name: s.user.class_name,
      }));

    return {
      className: cls.name,
      classCode,
      groups,
      studentsWithoutGroup,
    };
  }

  // ─── POST /groups — Tạo nhóm mới (teacher only) ───────────────────────────
  async createGroup(userId: string, dto: CreateGroupDto) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher)
      throw new ForbiddenException('Chỉ giáo viên mới có thể tạo nhóm.');

    const cls = await this.prisma.class.findUnique({
      where: { class_code: dto.classCode, deleted: false },
    });
    if (!cls || cls.supervisorId !== teacher.id) {
      throw new ForbiddenException('Bạn không có quyền quản lý lớp học này.');
    }

    const group = await this.prisma.classGroup.create({
      data: {
        name: dto.name,
        classCode: dto.classCode,
        color: dto.color,
        maxSize: dto.maxSize,
        createdById: teacher.id,
      },
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                user: {
                  select: {
                    username: true,
                    img: true,
                    class_name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      id: group.id,
      name: group.name,
      color: group.color,
      maxSize: group.maxSize,
      classCode: group.classCode,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      createdById: group.createdById,
      members: [],
    };
  }

  // ─── PATCH /groups/:id — Sửa thông tin nhóm ───────────────────────────────
  async updateGroup(groupId: string, userId: string, dto: UpdateGroupDto) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher)
      throw new ForbiddenException('Chỉ giáo viên mới có thể sửa nhóm.');

    const group = await this.prisma.classGroup.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm.');
    if (group.createdById !== teacher.id) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa nhóm này.');
    }

    const updated = await this.prisma.classGroup.update({
      where: { id: groupId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.maxSize !== undefined && { maxSize: dto.maxSize }),
      },
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                user: {
                  select: {
                    username: true,
                    img: true,
                    class_name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      color: updated.color,
      maxSize: updated.maxSize,
      classCode: updated.classCode,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      createdById: updated.createdById,
      members: updated.members.map((m) => ({
        id: m.id,
        groupId: m.groupId,
        studentId: m.studentId,
        role: m.role,
        joinedAt: m.joinedAt,
        student: {
          id: m.student.id,
          username: m.student.user.username,
          img: m.student.user.img,
          class_name: m.student.user.class_name,
        },
      })),
    };
  }

  // ─── DELETE /groups/:id — Xóa nhóm ───────────────────────────────────────
  async deleteGroup(groupId: string, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher)
      throw new ForbiddenException('Chỉ giáo viên mới có thể xóa nhóm.');

    const group = await this.prisma.classGroup.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm.');
    if (group.createdById !== teacher.id) {
      throw new ForbiddenException('Bạn không có quyền xóa nhóm này.');
    }

    await this.prisma.classGroup.delete({
      where: { id: groupId },
    });

    return { message: 'Đã xóa nhóm thành công.' };
  }

  // ─── POST /groups/members — Kéo thả cập nhật thành viên ───────────────────
  async updateGroupMembers(userId: string, dto: UpdateGroupMemberDto) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher)
      throw new ForbiddenException('Chỉ giáo viên mới có thể cập nhật nhóm.');

    const cls = await this.prisma.class.findUnique({
      where: { class_code: dto.classCode, deleted: false },
    });
    if (!cls || cls.supervisorId !== teacher.id) {
      throw new ForbiddenException('Bạn không có quyền quản lý lớp này.');
    }

    const studentInClass = await this.prisma.student.findFirst({
      where: {
        id: dto.studentId,
        classes: {
          some: {
            class_code: dto.classCode,
          },
        },
      },
    });
    if (!studentInClass) {
      throw new BadRequestException('Học sinh không thuộc lớp học này.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Xóa học sinh khỏi các nhóm thuộc lớp này
      await tx.classGroupMember.deleteMany({
        where: {
          studentId: dto.studentId,
          group: {
            classCode: dto.classCode,
          },
        },
      });

      // 2. Thêm vào nhóm mới nếu có targetGroupId
      if (dto.targetGroupId) {
        const targetGroup = await tx.classGroup.findFirst({
          where: {
            id: dto.targetGroupId,
            classCode: dto.classCode,
          },
          include: {
            members: true,
          },
        });

        if (!targetGroup) {
          throw new NotFoundException('Nhóm đích không tồn tại.');
        }

        if (
          targetGroup.maxSize &&
          targetGroup.members.length >= targetGroup.maxSize
        ) {
          throw new BadRequestException(
            `Nhóm đã đầy (tối đa ${targetGroup.maxSize} thành viên).`,
          );
        }

        await tx.classGroupMember.create({
          data: {
            groupId: dto.targetGroupId,
            studentId: dto.studentId,
            role: 'MEMBER',
          },
        });
      }

      return { message: 'Cập nhật thành viên nhóm thành công.' };
    });
  }

  // ─── POST /groups/:id/leader — Chọn nhóm trưởng ──────────────────────────
  async setGroupLeader(
    groupId: string,
    userId: string,
    dto: SetGroupLeaderDto,
  ) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher)
      throw new ForbiddenException(
        'Chỉ giáo viên mới có quyền đổi nhóm trưởng.',
      );

    const group = await this.prisma.classGroup.findUnique({
      where: { id: groupId },
    });
    if (!group || group.createdById !== teacher.id) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa nhóm này.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.classGroupMember.updateMany({
        where: { groupId },
        data: { role: 'MEMBER' },
      });

      await tx.classGroupMember.updateMany({
        where: { groupId, studentId: dto.studentId },
        data: { role: 'LEADER' },
      });

      return { message: 'Đã thiết lập nhóm trưởng thành công.' };
    });
  }
}
