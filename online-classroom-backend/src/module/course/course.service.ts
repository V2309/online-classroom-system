import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';
import {
  CourseQueryDto,
  CreateCourseDto,
  CreateFolderDto,
  MoveCourseDto,
  UpdateCourseDto,
  UpdateFolderDto,
} from './dto/course.dto';

function extractYouTubeThumbnail(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`
    : null;
}

function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'video'
  );
}

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Helper: lấy Teacher theo userId ──────────────────────────────────────
  private async getTeacherByUserId(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) {
      throw new ForbiddenException('Chỉ giáo viên mới có quyền thực hiện thao tác này.');
    }
    return teacher;
  }

  // ─── Helper: kiểm tra quyền truy cập lớp ─────────────────────────────────
  private async verifyClassAccess(classCode: string, userId: string, role: string) {
    if (role === 'teacher') {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });
      if (!teacher) throw new NotFoundException('Không tìm thấy giáo viên.');

      const cls = await this.prisma.class.findFirst({
        where: {
          class_code: classCode,
          deleted: false,
        },
      });
      if (!cls) throw new NotFoundException('Không tìm thấy lớp học.');
      return { teacherId: teacher.id, classRoom: cls };
    } else {
      const student = await this.prisma.student.findUnique({
        where: { userId },
      });
      if (!student) throw new NotFoundException('Không tìm thấy học sinh.');

      const cls = await this.prisma.class.findFirst({
        where: {
          class_code: classCode,
          deleted: false,
          students: {
            some: { id: student.id },
          },
        },
      });
      if (!cls) {
        throw new NotFoundException('Không tìm thấy lớp học hoặc bạn chưa tham gia.');
      }
      return { teacherId: cls.supervisorId, classRoom: cls };
    }
  }

  // ─── Helper: tạo unique video slug ───────────────────────────────────────
  private async generateUniqueVideoSlug(title: string): Promise<string> {
    const baseSlug = slugifyTitle(title);
    let uniqueSlug = baseSlug;
    let count = 1;

    while (await this.prisma.video.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${count++}`;
    }
    return uniqueSlug;
  }

  // ─── GET /courses/class/:classCode — Lấy danh sách khóa học và thư mục ───
  async getClassCourses(
    classCode: string,
    userId: string,
    role: string,
    queryDto: CourseQueryDto,
  ) {
    await this.verifyClassAccess(classCode, userId, role);

    const page = queryDto.page && queryDto.page > 0 ? queryDto.page : 1;
    const limit = queryDto.limit && queryDto.limit > 0 ? queryDto.limit : 10;
    const skip = (page - 1) * limit;

    const whereQuery: any = {
      classCode,
      isActive: true,
    };

    if (queryDto.search) {
      whereQuery.title = {
        contains: queryDto.search,
        mode: 'insensitive',
      };
    }

    if (queryDto.folderId) {
      if (queryDto.folderId === 'unassigned') {
        whereQuery.folderId = null;
      } else {
        whereQuery.folderId = queryDto.folderId;
      }
    }

    const [courses, count, folders, allCoursesCount] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where: whereQuery,
        include: {
          videos: { orderBy: { orderIndex: 'asc' } },
          folder: true,
          teacher: {
            include: {
              user: {
                select: { username: true, img: true },
              },
            },
          },
          _count: { select: { videos: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.course.count({ where: whereQuery }),
      this.prisma.folder.findMany({
        where: {
          classCode,
        },
        include: {
          _count: {
            select: {
              courses: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.course.count({
        where: {
          classCode,
          isActive: true,
        },
      }),
    ]);

    return {
      courses,
      count,
      folders,
      allCoursesCount,
      page,
      limit,
    };
  }

  // ─── GET /courses/class/:classCode/folders — Lấy danh sách thư mục ───────
  async getClassFolders(classCode: string, userId: string, role: string) {
    await this.verifyClassAccess(classCode, userId, role);

    return this.prisma.folder.findMany({
      where: {
        classCode,
      },
      include: {
        _count: {
          select: {
            courses: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── GET /courses/:id — Lấy chi tiết khóa học (kèm chapters & videos) ────
  async getCourseById(
    courseId: string,
    classCode: string,
    userId: string,
    role: string,
  ) {
    await this.verifyClassAccess(classCode, userId, role);

    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        classCode,
        isActive: true,
      },
      include: {
        chapters: {
          where: { isActive: true },
          include: {
            videos: {
              where: { isActive: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        teacher: {
          include: {
            user: {
              select: { username: true, img: true },
            },
          },
        },
        folder: true,
      },
    });

    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');
    return course;
  }

  // ─── POST /courses — Tạo khóa học mới (Teacher) ──────────────────────────
  async createCourse(userId: string, dto: CreateCourseDto) {
    const teacher = await this.getTeacherByUserId(userId);

    const cls = await this.prisma.class.findFirst({
      where: {
        class_code: dto.classCode,
        deleted: false,
      },
    });
    if (!cls) throw new NotFoundException('Không tìm thấy lớp học.');

    return this.prisma.$transaction(async (tx) => {
      let finalFolderId = dto.folderId;

      // Xử lý tạo folder mới nếu có yêu cầu
      if (!dto.folderId && dto.newFolderName && dto.newFolderName.trim()) {
        const existingFolder = await tx.folder.findFirst({
          where: {
            name: dto.newFolderName.trim(),
            classCode: dto.classCode,
          },
        });

        if (existingFolder) {
          finalFolderId = existingFolder.id;
        } else {
          const newFolder = await tx.folder.create({
            data: {
              name: dto.newFolderName.trim(),
              description: dto.newFolderDescription?.trim() || null,
              color: dto.newFolderColor || '#3B82F6',
              classCode: dto.classCode,
              createdBy: teacher.id,
            },
          });
          finalFolderId = newFolder.id;
        }
      }

      // Tạo Course
      const course = await tx.course.create({
        data: {
          title: dto.title,
          description: dto.description || null,
          thumbnailUrl: dto.thumbnailUrl || null,
          folderId: finalFolderId || null,
          classCode: dto.classCode,
          createdBy: teacher.id,
        },
      });

      let autoThumbnailUrl: string | null = null;

      // Tạo Chapters và Videos
      if (dto.chapters && Array.isArray(dto.chapters)) {
        for (let chapterIndex = 0; chapterIndex < dto.chapters.length; chapterIndex++) {
          const chapterDto = dto.chapters[chapterIndex];
          if (chapterDto.title?.trim()) {
            const chapter = await tx.chapter.create({
              data: {
                title: chapterDto.title,
                description: chapterDto.description || null,
                orderIndex: chapterDto.orderIndex ?? chapterIndex,
                courseId: course.id,
                createdBy: teacher.id,
              },
            });

            if (chapterDto.videos && Array.isArray(chapterDto.videos)) {
              for (let videoIndex = 0; videoIndex < chapterDto.videos.length; videoIndex++) {
                const videoDto = chapterDto.videos[videoIndex];
                if (videoDto.title?.trim() && videoDto.url?.trim()) {
                  const videoThumbnailUrl = extractYouTubeThumbnail(videoDto.url);
                  if (!autoThumbnailUrl && videoThumbnailUrl) {
                    autoThumbnailUrl = videoThumbnailUrl;
                  }

                  const videoSlug = await this.generateUniqueVideoSlug(videoDto.title);

                  await tx.video.create({
                    data: {
                      title: videoDto.title,
                      description: videoDto.description || null,
                      slug: videoSlug,
                      url: videoDto.url,
                      thumbnailUrl: videoThumbnailUrl,
                      duration: videoDto.duration || null,
                      orderIndex: videoDto.orderIndex ?? videoIndex,
                      chapterId: chapter.id,
                      courseId: course.id,
                      createdBy: teacher.id,
                    },
                  });
                }
              }
            }
          }
        }
      }

      // Cập nhật thumbnail nếu cần
      if (autoThumbnailUrl && !course.thumbnailUrl) {
        await tx.course.update({
          where: { id: course.id },
          data: { thumbnailUrl: autoThumbnailUrl },
        });
      }

      return course;
    });
  }

  // ─── PATCH /courses/:id — Cập nhật khóa học (Teacher) ────────────────────
  async updateCourse(courseId: string, userId: string, dto: UpdateCourseDto) {
    const teacher = await this.getTeacherByUserId(userId);

    const existingCourse = await this.prisma.course.findFirst({
      where: {
        id: courseId,
      },
    });
    if (!existingCourse) {
      throw new NotFoundException('Không tìm thấy khóa học.');
    }

    return this.prisma.$transaction(async (tx) => {
      let finalFolderId = dto.folderId !== undefined ? dto.folderId : existingCourse.folderId;

      // Xử lý tạo folder mới nếu có
      if (!dto.folderId && dto.newFolderName && dto.newFolderName.trim()) {
        const existingFolder = await tx.folder.findFirst({
          where: {
            name: dto.newFolderName.trim(),
            classCode: existingCourse.classCode,
          },
        });

        if (existingFolder) {
          finalFolderId = existingFolder.id;
        } else {
          const newFolder = await tx.folder.create({
            data: {
              name: dto.newFolderName.trim(),
              description: dto.newFolderDescription?.trim() || null,
              color: dto.newFolderColor || '#3B82F6',
              classCode: existingCourse.classCode,
              createdBy: teacher.id,
            },
          });
          finalFolderId = newFolder.id;
        }
      }

      let autoThumbnailUrl: string | null = null;

      // Nếu có gửi danh sách chapters mới, xóa cũ và tạo lại
      if (dto.chapters && Array.isArray(dto.chapters)) {
        await tx.video.deleteMany({ where: { courseId } });
        await tx.chapter.deleteMany({ where: { courseId } });

        for (let chapterIndex = 0; chapterIndex < dto.chapters.length; chapterIndex++) {
          const chapterDto = dto.chapters[chapterIndex];
          if (chapterDto.title?.trim()) {
            const chapter = await tx.chapter.create({
              data: {
                title: chapterDto.title,
                description: chapterDto.description || null,
                orderIndex: chapterDto.orderIndex ?? chapterIndex,
                courseId,
                createdBy: teacher.id,
              },
            });

            if (chapterDto.videos && Array.isArray(chapterDto.videos)) {
              for (let videoIndex = 0; videoIndex < chapterDto.videos.length; videoIndex++) {
                const videoDto = chapterDto.videos[videoIndex];
                if (videoDto.title?.trim() && videoDto.url?.trim()) {
                  const videoThumbnailUrl = extractYouTubeThumbnail(videoDto.url);
                  if (!autoThumbnailUrl && videoThumbnailUrl) {
                    autoThumbnailUrl = videoThumbnailUrl;
                  }

                  const videoSlug = await this.generateUniqueVideoSlug(videoDto.title);

                  await tx.video.create({
                    data: {
                      title: videoDto.title,
                      description: videoDto.description || null,
                      slug: videoSlug,
                      url: videoDto.url,
                      thumbnailUrl: videoThumbnailUrl,
                      duration: videoDto.duration || null,
                      orderIndex: videoDto.orderIndex ?? videoIndex,
                      chapterId: chapter.id,
                      courseId,
                      createdBy: teacher.id,
                    },
                  });
                }
              }
            }
          }
        }
      }

      const updated = await tx.course.update({
        where: { id: courseId },
        data: {
          title: dto.title ?? existingCourse.title,
          description: dto.description !== undefined ? dto.description : existingCourse.description,
          thumbnailUrl:
            dto.thumbnailUrl || autoThumbnailUrl || existingCourse.thumbnailUrl,
          folderId: finalFolderId,
        },
      });

      return updated;
    });
  }

  // ─── DELETE /courses/:id — Xóa khóa học (Teacher) ────────────────────────
  async deleteCourse(courseId: string, userId: string) {
    await this.getTeacherByUserId(userId);

    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
      },
    });
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');

    await this.prisma.course.delete({
      where: { id: courseId },
    });

    return { message: 'Đã xóa khóa học thành công.' };
  }

  // ─── POST /courses/:id/move — Di chuyển khóa học vào folder (Teacher) ────
  async moveCourseToFolder(courseId: string, userId: string, dto: MoveCourseDto) {
    await this.getTeacherByUserId(userId);

    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
      },
    });
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');

    const targetFolderId =
      dto.newFolderId === 'unassigned' || !dto.newFolderId ? null : dto.newFolderId;

    await this.prisma.course.update({
      where: { id: courseId },
      data: { folderId: targetFolderId },
    });

    return { message: 'Đã di chuyển khóa học thành công.' };
  }

  // ─── POST /courses/folders — Tạo thư mục mới (Teacher) ────────────────────
  async createFolder(userId: string, dto: CreateFolderDto) {
    const teacher = await this.getTeacherByUserId(userId);

    const cls = await this.prisma.class.findFirst({
      where: {
        class_code: dto.classCode,
        deleted: false,
      },
    });
    if (!cls) throw new NotFoundException('Không tìm thấy lớp học.');

    return this.prisma.folder.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        color: dto.color || '#3B82F6',
        classCode: dto.classCode,
        createdBy: teacher.id,
      },
    });
  }

  // ─── PATCH /courses/folders/:id — Sửa thư mục (Teacher) ──────────────────
  async updateFolder(folderId: string, userId: string, dto: UpdateFolderDto) {
    await this.getTeacherByUserId(userId);

    const folder = await this.prisma.folder.findFirst({
      where: {
        id: folderId,
      },
    });
    if (!folder) throw new NotFoundException('Không tìm thấy thư mục.');

    return this.prisma.folder.update({
      where: { id: folderId },
      data: {
        name: dto.name ? dto.name.trim() : folder.name,
        description:
          dto.description !== undefined ? dto.description?.trim() || null : folder.description,
        color: dto.color ?? folder.color,
      },
    });
  }

  // ─── DELETE /courses/folders/:id — Xóa thư mục (Teacher) ─────────────────
  async deleteFolder(folderId: string, userId: string) {
    await this.getTeacherByUserId(userId);

    const folder = await this.prisma.folder.findFirst({
      where: {
        id: folderId,
      },
    });
    if (!folder) throw new NotFoundException('Không tìm thấy thư mục.');

    await this.prisma.$transaction(async (tx) => {
      // Chuyển courses về null folderId
      await tx.course.updateMany({
        where: { folderId },
        data: { folderId: null },
      });

      await tx.folder.delete({
        where: { id: folderId },
      });
    });

    return {
      message: `Đã xóa thư mục "${folder.name}". Các khóa học trong thư mục đã được chuyển về "Tất cả".`,
    };
  }
}
