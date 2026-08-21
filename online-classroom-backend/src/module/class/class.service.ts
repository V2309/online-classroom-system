import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';

const ITEM_PER_PAGE = 8;

function generateClassCode(length = 5): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
}

@Injectable()
export class ClassService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── GET /classes ──────────────────────────────────────────────────────────
  async getClasses(
    userId: string,
    role: string,
    query: { page?: string; type?: string; search?: string },
  ) {
    const pageNum = parseInt(query.page || '1', 10);
    const skip = ITEM_PER_PAGE * (pageNum - 1);

    const where: any = { deleted: false };

    if (role === 'teacher') {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });
      if (!teacher)
        throw new NotFoundException('Không tìm thấy thông tin giáo viên.');
      where.supervisorId = teacher.id;
    } else if (role === 'student') {
      const student = await this.prisma.student.findUnique({
        where: { userId },
      });
      if (!student)
        throw new NotFoundException('Không tìm thấy thông tin học sinh.');

      if (query.type === 'pending') {
        // Lớp mà học sinh có join request PENDING
        where.joinRequests = {
          some: { studentId: student.id, status: 'PENDING' },
        };
      } else {
        // Lớp học sinh đã được vào (many-to-many)
        where.students = { some: { id: student.id } };
      }
    }

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const include: any = {
      supervisor: {
        include: { user: { select: { username: true, img: true } } },
      },
      grade: true,
      _count: { select: { students: true } },
    };

    if (role === 'student' && query.type === 'pending') {
      include.joinRequests = { where: { status: 'PENDING' } };
    }

    const [data, count] = await this.prisma.$transaction([
      this.prisma.class.findMany({
        where,
        include,
        take: ITEM_PER_PAGE,
        skip,
      }),
      this.prisma.class.count({ where }),
    ]);

    let currentClassCount = 0;
    if (role === 'teacher') {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });
      if (teacher) {
        currentClassCount = await this.prisma.class.count({
          where: { supervisorId: teacher.id, deleted: false },
        });
      }
    }

    return { data, count, currentClassCount, page: pageNum };
  }

  // ─── GET /classes/:code (tìm theo class_code) ────────────────────────────
  async getClassByCode(classCode: string) {
    const cls = await this.prisma.class.findUnique({
      where: { class_code: classCode, deleted: false },
      include: {
        supervisor: {
          include: { user: { select: { username: true, img: true } } },
        },
        grade: true,
        _count: { select: { students: true } },
      },
    });
    if (!cls) throw new NotFoundException('Lớp học không tồn tại.');
    return cls;
  }

  // ─── POST /classes ─────────────────────────────────────────────────────────
  async createClass(userId: string, dto: CreateClassDto) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher)
      throw new NotFoundException('Không tìm thấy thông tin giáo viên.');

    // Sinh class_code không trùng
    let class_code: string;
    let exists = true;
    do {
      class_code = generateClassCode();
      const found = await this.prisma.class.findUnique({
        where: { class_code },
      });
      exists = !!found;
    } while (exists);

    return this.prisma.class.create({
      data: {
        name: dto.name,
        class_code,
        capacity: dto.capacity ?? 50,
        gradeId: dto.gradeId,
        img: dto.img,
        supervisorId: teacher.id,
      },
      include: { grade: true },
    });
  }

  // ─── PATCH /classes/:id ────────────────────────────────────────────────────
  async updateClass(classId: number, userId: string, dto: UpdateClassDto) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher)
      throw new ForbiddenException('Chỉ giáo viên mới có thể sửa lớp.');

    const cls = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!cls || cls.deleted)
      throw new NotFoundException('Lớp học không tồn tại.');
    if (cls.supervisorId !== teacher.id)
      throw new ForbiddenException('Bạn không có quyền sửa lớp này.');

    let finalGradeId = dto.gradeId;
    if (dto.newGradeLevel && dto.newGradeLevel.trim()) {
      const levelStr = dto.newGradeLevel.trim();
      let grade = await this.prisma.grade.findUnique({
        where: { level: levelStr },
      });
      if (!grade) {
        grade = await this.prisma.grade.create({ data: { level: levelStr } });
      }
      finalGradeId = grade.id;
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.capacity !== undefined) updateData.capacity = dto.capacity;
    if (finalGradeId !== undefined) updateData.gradeId = finalGradeId;
    if (dto.img !== undefined) updateData.img = dto.img;
    if (dto.isProtected !== undefined) updateData.isProtected = dto.isProtected;
    if (dto.isLocked !== undefined) updateData.isLocked = dto.isLocked;
    if (dto.requiresApproval !== undefined)
      updateData.requiresApproval = dto.requiresApproval;
    if (dto.blockLeave !== undefined) updateData.blockLeave = dto.blockLeave;
    if (dto.allowGradesView !== undefined)
      updateData.allowGradesView = dto.allowGradesView;
    if (dto.supervisorId !== undefined)
      updateData.supervisorId = dto.supervisorId;

    return this.prisma.class.update({
      where: { id: classId },
      data: updateData,
      include: {
        grade: true,
        supervisor: {
          include: { user: { select: { username: true, img: true } } },
        },
      },
    });
  }

  // ─── DELETE /classes/:id (soft delete) ────────────────────────────────────
  async deleteClass(classId: number, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher)
      throw new ForbiddenException('Chỉ giáo viên mới có thể xóa lớp.');

    const cls = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!cls || cls.deleted)
      throw new NotFoundException('Lớp học không tồn tại.');
    if (cls.supervisorId !== teacher.id)
      throw new ForbiddenException('Bạn không có quyền xóa lớp này.');

    return this.prisma.class.update({
      where: { id: classId },
      data: { deleted: true, deletedAt: new Date() },
    });
  }

  // ─── POST /classes/:id/restore ─────────────────────────────────────────────
  async restoreClass(classId: number, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher)
      throw new ForbiddenException('Chỉ giáo viên mới có thể khôi phục lớp.');

    const cls = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!cls) throw new NotFoundException('Lớp học không tồn tại.');
    if (cls.supervisorId !== teacher.id)
      throw new ForbiddenException('Bạn không có quyền khôi phục lớp này.');

    return this.prisma.class.update({
      where: { id: classId },
      data: { deleted: false, deletedAt: null },
    });
  }

  // ─── GET /classes/deleted ──────────────────────────────────────────────────
  async getDeletedClasses(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher)
      throw new ForbiddenException('Chỉ giáo viên mới có thể xem lớp đã xóa.');

    return this.prisma.class.findMany({
      where: { supervisorId: teacher.id, deleted: true },
      include: { _count: { select: { students: true } }, grade: true },
      orderBy: { deletedAt: 'desc' },
    });
  }

  // ─── POST /classes/:code/join ──────────────────────────────────────────────
  // ClassJoinRequest dùng classCode (String) + studentId (String)
  async joinClass(classCode: string, userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student)
      throw new NotFoundException('Không tìm thấy thông tin học sinh.');

    const cls = await this.prisma.class.findUnique({
      where: { class_code: classCode, deleted: false },
      include: { _count: { select: { students: true } } },
    });
    if (!cls)
      throw new NotFoundException(
        'Mã lớp không hợp lệ hoặc lớp không tồn tại.',
      );

    // Kiểm tra đã là thành viên
    const isMember = await this.prisma.class.findFirst({
      where: { class_code: classCode, students: { some: { id: student.id } } },
    });
    if (isMember)
      throw new ConflictException('Bạn đã là thành viên của lớp này.');

    // Kiểm tra sĩ số
    if (cls._count.students >= cls.capacity) {
      throw new BadRequestException('Lớp học đã đầy.');
    }

    // Kiểm tra đã có join request PENDING
    const pending = await this.prisma.classJoinRequest.findFirst({
      where: { classCode, studentId: student.id, status: 'PENDING' },
    });
    if (pending)
      throw new ConflictException(
        'Bạn đã gửi yêu cầu, đang chờ giáo viên duyệt.',
      );

    return this.prisma.classJoinRequest.create({
      data: { classCode, studentId: student.id, status: 'PENDING' },
    });
  }

  // ─── POST /classes/:id/leave ───────────────────────────────────────────────
  async leaveClass(classId: number, userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student)
      throw new NotFoundException('Không tìm thấy thông tin học sinh.');

    const cls = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!cls || cls.deleted)
      throw new NotFoundException('Lớp học không tồn tại.');

    if (cls.blockLeave)
      throw new ForbiddenException('Giáo viên đã khóa tính năng rời lớp.');

    const isMember = await this.prisma.class.findFirst({
      where: { id: classId, students: { some: { id: student.id } } },
    });
    if (!isMember)
      throw new BadRequestException('Bạn không phải thành viên của lớp này.');

    await this.prisma.class.update({
      where: { id: classId },
      data: { students: { disconnect: { id: student.id } } },
    });

    return { message: 'Rời lớp thành công.' };
  }

  // ─── GET /classes/:id/join-requests ───────────────────────────────────────
  async getJoinRequests(classId: number, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher)
      throw new ForbiddenException('Chỉ giáo viên mới có thể xem yêu cầu.');

    const cls = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!cls || cls.deleted)
      throw new NotFoundException('Lớp học không tồn tại.');
    if (cls.supervisorId !== teacher.id)
      throw new ForbiddenException('Bạn không có quyền xem lớp này.');

    // ClassJoinRequest quan hệ với Class qua classCode
    return this.prisma.classJoinRequest.findMany({
      where: { classCode: cls.class_code ?? undefined, status: 'PENDING' },
      include: {
        student: {
          include: {
            user: { select: { username: true, img: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── POST /classes/join-requests/:requestId/approve ───────────────────────
  async approveJoinRequest(requestId: number, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher)
      throw new ForbiddenException('Chỉ giáo viên mới có thể duyệt yêu cầu.');

    const request = await this.prisma.classJoinRequest.findUnique({
      where: { id: requestId },
      include: { class: true },
    });
    if (!request || request.status !== 'PENDING')
      throw new NotFoundException('Yêu cầu không tồn tại hoặc đã xử lý.');
    if (!request.class || request.class.supervisorId !== teacher.id)
      throw new ForbiddenException('Bạn không có quyền duyệt yêu cầu này.');

    // Kiểm tra sĩ số trước khi approve
    const memberCount = await this.prisma.class.findUnique({
      where: { id: request.class.id },
      include: { _count: { select: { students: true } } },
    });
    if (memberCount && memberCount._count.students >= memberCount.capacity) {
      throw new BadRequestException('Lớp đã đầy, không thể thêm học sinh.');
    }

    return this.prisma.$transaction([
      this.prisma.classJoinRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      }),
      this.prisma.class.update({
        where: { id: request.class.id },
        data: { students: { connect: { id: request.studentId } } },
      }),
    ]);
  }

  // ─── POST /classes/join-requests/:requestId/reject ────────────────────────
  async rejectJoinRequest(requestId: number, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher)
      throw new ForbiddenException('Chỉ giáo viên mới có thể từ chối yêu cầu.');

    const request = await this.prisma.classJoinRequest.findUnique({
      where: { id: requestId },
      include: { class: true },
    });
    if (!request || request.status !== 'PENDING')
      throw new NotFoundException('Yêu cầu không tồn tại hoặc đã xử lý.');
    if (!request.class || request.class.supervisorId !== teacher.id)
      throw new ForbiddenException('Bạn không có quyền từ chối yêu cầu này.');

    return this.prisma.classJoinRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });
  }

  // ─── Lấy danh sách khối lớp (Grades) ───────────────────────────────────────
  async getGrades() {
    return this.prisma.grade.findMany({
      select: {
        id: true,
        level: true,
      },
      orderBy: {
        level: 'asc',
      },
    });
  }

  // ─── GET /classes/:code/members — Danh sách thành viên lớp học ─────────────
  async getClassMembers(
    classCode: string,
    userId: string,
    role: string,
    query: { page?: string; search?: string },
  ) {
    const cls = await this.prisma.class.findUnique({
      where: { class_code: classCode, deleted: false },
      select: { id: true, capacity: true, supervisorId: true },
    });
    if (!cls) throw new NotFoundException('Lớp học không tồn tại.');

    const pageNum = parseInt(query.page || '1', 10);
    const skip = ITEM_PER_PAGE * (pageNum - 1);

    const where: any = {
      classes: {
        some: {
          class_code: classCode,
        },
      },
    };

    if (query.search) {
      where.user = {
        username: {
          contains: query.search,
          mode: 'insensitive',
        },
      };
    }

    const [rawStudents, count] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        select: {
          id: true,
          user: {
            select: {
              username: true,
              schoolname: true,
              img: true,
              class_name: true,
            },
          },
          classes: {
            select: {
              name: true,
            },
          },
        },
        take: ITEM_PER_PAGE,
        skip,
      }),
      this.prisma.student.count({
        where,
      }),
    ]);

    let pendingRequests: any[] = [];
    if (role === 'teacher') {
      const rawRequests = await this.prisma.classJoinRequest.findMany({
        where: {
          classCode,
          status: 'PENDING',
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  username: true,
                  img: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      pendingRequests = rawRequests.map((r) => ({
        id: r.id,
        classCode: r.classCode,
        studentId: r.studentId,
        status: r.status,
        createdAt: r.createdAt,
        student: {
          id: r.student.id,
          username: r.student.user.username,
          img: r.student.user.img,
        },
      }));
    }

    const data = rawStudents.map((s) => ({
      id: s.id,
      username: s.user.username,
      schoolname: s.user.schoolname,
      img: s.user.img,
      class_name: s.user.class_name,
      classes: s.classes,
    }));

    return {
      data,
      count,
      capacity: cls.capacity,
      pendingRequests,
      page: pageNum,
    };
  }

  // ─── DELETE /classes/:code/members/:studentId — Xóa học sinh khỏi lớp ───────
  async removeStudentFromClass(
    classCode: string,
    studentId: string,
    userId: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher)
      throw new ForbiddenException(
        'Chỉ giáo viên mới có thể xóa học sinh khỏi lớp.',
      );

    const cls = await this.prisma.class.findUnique({
      where: { class_code: classCode, deleted: false },
    });
    if (!cls) throw new NotFoundException('Lớp học không tồn tại.');
    if (cls.supervisorId !== teacher.id) {
      throw new ForbiddenException('Bạn không có quyền quản lý lớp này.');
    }

    await this.prisma.class.update({
      where: { id: cls.id },
      data: {
        students: {
          disconnect: { id: studentId },
        },
      },
    });

    return { message: 'Đã xóa học sinh khỏi lớp học thành công.' };
  }
}
