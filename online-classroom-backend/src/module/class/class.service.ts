import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';

@Injectable()
export class ClassService {
  constructor(private readonly prisma: PrismaService) {}

  async getClasses(
    userId: string,
    role: string,
    query: { page?: string; type?: string; search?: string },
  ) {
    const pageNum = parseInt(query.page || '1', 10);
    const limit = 8; // Matching frontend ITEM_PER_PAGE
    const skip = limit * (pageNum - 1);

    const prismaQuery: any = {
      deleted: false,
    };

    if (role === 'teacher') {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });
      if (!teacher) {
        throw new NotFoundException('Không tìm thấy thông tin giáo viên.');
      }
      prismaQuery.supervisorId = teacher.id;
    } else if (role === 'student') {
      const student = await this.prisma.student.findUnique({
        where: { userId },
      });
      if (!student) {
        throw new NotFoundException('Không tìm thấy thông tin học sinh.');
      }

      if (query.type === 'pending') {
        prismaQuery.joinRequests = {
          some: {
            studentId: student.id,
            status: 'PENDING',
          },
        };
      } else {
        prismaQuery.students = {
          some: {
            id: student.id,
          },
        };
      }
    }

    if (query.search) {
      prismaQuery.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const [data, count] = await this.prisma.$transaction([
      this.prisma.class.findMany({
        where: prismaQuery,
        include: {
          supervisor: true,
          joinRequests:
            role === 'student' && query.type === 'pending'
              ? {
                  where: {
                    status: 'PENDING',
                  },
                  include: {
                    student: true,
                  },
                }
              : false,
          _count: {
            select: {
              students: true,
            },
          },
        },
        take: limit,
        skip: skip,
      }),
      this.prisma.class.count({
        where: prismaQuery,
      }),
    ]);

    // Calculate currentClassCount for teachers (total classes excluding soft-deleted ones)
    let currentClassCount = 0;
    if (role === 'teacher') {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });
      if (teacher) {
        currentClassCount = await this.prisma.class.count({
          where: {
            supervisorId: teacher.id,
            deleted: false,
          },
        });
      }
    }

    return {
      data,
      count,
      currentClassCount,
    };
  }
}
