import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';
import { R2Service } from '../../lib/r2/r2.service';
import { CreateDocumentDto, DocumentQueryDto } from './dto/document.dto';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2Service: R2Service,
  ) {}

  // ─── Helper: lấy Teacher theo userId ──────────────────────────────────────
  private async getTeacherByUserId(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) {
      throw new ForbiddenException(
        'Chỉ giáo viên mới có quyền thực hiện thao tác này.',
      );
    }
    return teacher;
  }

  // ─── Helper: kiểm tra quyền truy cập lớp ─────────────────────────────────
  private async verifyClassAccess(
    classCode: string,
    userId: string,
    role: string,
  ) {
    if (role === 'admin') {
      const cls = await this.prisma.class.findFirst({
        where: {
          class_code: classCode,
          deleted: false,
        },
      });
      if (!cls) throw new NotFoundException('Không tìm thấy lớp học.');
      return { teacherId: cls.supervisorId, classRoom: cls };
    }

    if (role === 'teacher') {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      const cls = await this.prisma.class.findFirst({
        where: {
          class_code: classCode,
          deleted: false,
        },
      });
      if (!cls) throw new NotFoundException('Không tìm thấy lớp học.');
      return { teacherId: teacher?.id || cls.supervisorId, classRoom: cls };
    } else {
      const student = await this.prisma.student.findUnique({
        where: { userId },
      });

      const cls = await this.prisma.class.findFirst({
        where: {
          class_code: classCode,
          deleted: false,
          ...(student
            ? {
                students: {
                  some: { id: student.id },
                },
              }
            : {}),
        },
      });
      if (!cls) {
        throw new NotFoundException(
          'Không tìm thấy lớp học hoặc bạn chưa tham gia.',
        );
      }
      return { teacherId: cls.supervisorId, classRoom: cls };
    }
  }

  private formatFileUrl(url: string): string {
    if (!url) return url;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';

    if (url.startsWith('http') && url.includes('/api/upload/r2-file')) {
      return url;
    }

    if (url.includes('r2.cloudflarestorage.com')) {
      const parts = url.split('.r2.cloudflarestorage.com/');
      if (parts[1]) {
        const pathAfterBucket = parts[1].includes('/')
          ? parts[1].substring(parts[1].indexOf('/') + 1)
          : parts[1];
        return `${backendUrl}/api/upload/r2-file?key=${encodeURIComponent(pathAfterBucket)}`;
      }
    }

    if (url.startsWith('documents/')) {
      return `${backendUrl}/api/upload/r2-file?key=${encodeURIComponent(url)}`;
    }

    return url;
  }

  // ─── GET /documents — Lấy danh sách tài liệu ─────────────────────────────
  async getDocuments(userId: string, role: string, queryDto: DocumentQueryDto) {
    const classCode = queryDto.classCode;
    if (classCode) {
      await this.verifyClassAccess(classCode, userId, role);
    }

    const page = queryDto.page && queryDto.page > 0 ? queryDto.page : 1;
    const limit = queryDto.limit && queryDto.limit > 0 ? queryDto.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (classCode) {
      whereClause.classCode = classCode;
    }

    if (queryDto.search) {
      whereClause.name = {
        contains: queryDto.search,
        mode: 'insensitive',
      };
    }

    const [files, count] = await this.prisma.$transaction([
      this.prisma.file.findMany({
        where: whereClause,
        include: {
          teacher: {
            include: {
              user: {
                select: { username: true, img: true },
              },
            },
          },
          class: {
            select: {
              name: true,
              class_code: true,
            },
          },
          views: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
            orderBy: {
              viewedAt: 'asc',
            },
          },
          _count: {
            select: {
              views: true,
            },
          },
        },
        orderBy: {
          uploadedAt: 'desc',
        },
        take: limit,
        skip,
      }),
      this.prisma.file.count({ where: whereClause }),
    ]);

    const filesWithViewStatus = files.map((file) => {
      const userView = file.views.find((view) => view.user.id === userId);
      return {
        ...file,
        url: this.formatFileUrl(file.url),
        teacher: {
          username: file.teacher.user.username,
        },
        viewedByCurrentUser: !!userView,
        firstViewedAt: userView?.viewedAt || null,
      };
    });

    return {
      files: filesWithViewStatus,
      count,
      page,
      limit,
    };
  }

  // ─── GET /documents/:id — Lấy chi tiết tài liệu & ghi nhận lượt xem ───────
  async getDocumentDetail(docId: string, userId: string, role: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: docId },
      include: {
        teacher: {
          include: {
            user: {
              select: { username: true, img: true },
            },
          },
        },
        class: {
          select: {
            name: true,
            class_code: true,
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('Không tìm thấy tài liệu.');
    }

    if (file.classCode) {
      await this.verifyClassAccess(file.classCode, userId, role);
    }

    // Ghi nhận lượt xem nếu chưa có (chỉ lưu thời gian xem lần đầu)
    try {
      await this.prisma.fileView.upsert({
        where: {
          fileId_userId: {
            fileId: docId,
            userId,
          },
        },
        update: {},
        create: {
          fileId: docId,
          userId,
          viewedAt: new Date(),
        },
      });
    } catch (error) {
      // Không block nếu lỗi log view
    }

    return {
      ...file,
      url: this.formatFileUrl(file.url),
      teacher: {
        username: file.teacher.user.username,
      },
    };
  }

  // ─── GET /documents/:id/viewers — Lấy thống kê & danh sách người xem ─────
  async getDocumentViewers(docId: string, userId: string, role: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: docId },
      select: { classCode: true },
    });

    if (!file || !file.classCode) {
      throw new NotFoundException(
        'Không tìm thấy tài liệu hoặc tài liệu không thuộc lớp học.',
      );
    }

    const classCode = file.classCode;
    await this.verifyClassAccess(classCode, userId, role);

    const classInfo = await this.prisma.class.findUnique({
      where: { class_code: classCode },
      select: {
        students: {
          select: { id: true, userId: true },
        },
      },
    });

    const currentStudentUserIds =
      classInfo?.students.map((s) => s.userId) || [];

    const [studentViewsCount, totalViewsCount, allViews] =
      await this.prisma.$transaction([
        this.prisma.fileView.count({
          where: {
            fileId: docId,
            userId: { in: currentStudentUserIds },
          },
        }),
        this.prisma.fileView.count({
          where: {
            fileId: docId,
          },
        }),
        this.prisma.fileView.findMany({
          where: {
            fileId: docId,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
          orderBy: {
            viewedAt: 'desc',
          },
        }),
      ]);

    const viewers = allViews.map((view) => {
      const isStudent = view.user.role === 'student';
      const isStillInClass =
        view.user.role === 'teacher' ||
        (isStudent && currentStudentUserIds.includes(view.user.id));

      return {
        id: view.userId,
        username: view.user.username,
        role: view.user.role,
        viewedAt: view.viewedAt,
        isStillInClass,
      };
    });

    return {
      stats: {
        totalViews: totalViewsCount,
        studentViews: studentViewsCount,
        totalStudents: currentStudentUserIds.length,
      },
      viewers,
    };
  }

  // ─── POST /documents — Tạo tài liệu mới (Teacher) ─────────────────────────
  async createDocument(userId: string, dto: CreateDocumentDto) {
    const teacher = await this.getTeacherByUserId(userId);

    const cls = await this.prisma.class.findFirst({
      where: {
        class_code: dto.classCode,
        deleted: false,
      },
    });
    if (!cls) {
      throw new NotFoundException('Không tìm thấy lớp học.');
    }

    const file = await this.prisma.file.create({
      data: {
        name: dto.name,
        url: dto.url,
        type: dto.type,
        size: dto.size,
        uploadedBy: teacher.id,
        classCode: dto.classCode,
      },
      include: {
        teacher: {
          include: {
            user: { select: { username: true } },
          },
        },
        class: {
          select: {
            name: true,
            class_code: true,
          },
        },
      },
    });

    return {
      ...file,
      teacher: {
        username: file.teacher.user.username,
      },
    };
  }

  // ─── DELETE /documents/:id — Xóa tài liệu (Teacher) ──────────────────────
  async deleteDocument(docId: string, userId: string) {
    const teacher = await this.getTeacherByUserId(userId);

    const file = await this.prisma.file.findUnique({
      where: { id: docId },
      include: {
        class: {
          select: { supervisorId: true },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('Không tìm thấy tài liệu.');
    }

    if (
      file.uploadedBy !== teacher.id &&
      file.class?.supervisorId !== teacher.id
    ) {
      throw new ForbiddenException('Bạn không có quyền xóa tài liệu này.');
    }

    try {
      if (file.url && file.url.includes('documents/')) {
        const key = file.url.substring(file.url.indexOf('documents/'));
        await this.r2Service.deleteFile(key);
      }
    } catch (error) {
      // Log error but proceed with DB delete
    }

    await this.prisma.file.delete({
      where: { id: docId },
    });

    return { message: 'Đã xóa tài liệu thành công.' };
  }
}
