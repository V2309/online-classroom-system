import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';
import {
  CreateHomeworkDto,
  GradingMethodEnum,
  StudentViewPermissionEnum,
} from './dto/create-homework.dto';
import {
  UpdateHomeworkQuestionsDto,
  UpdateHomeworkSettingsDto,
} from './dto/update-homework.dto';
import {
  GradeSubmissionDto,
  SaveDraftDto,
  SubmitHomeworkDto,
} from './dto/submission.dto';
import { SubmissionDetailQueryDto } from './dto/homework-query.dto';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class HomeworkService {
  private readonly logger = new Logger(HomeworkService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Helper: lấy Teacher từ userId hoặc teacherId ─────────────────────────
  private async getTeacher(userId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        OR: [{ userId }, { id: userId }],
      },
    });
    if (!teacher) {
      throw new ForbiddenException('Chỉ giáo viên mới có quyền thực hiện thao tác này.');
    }
    return teacher;
  }

  // ─── Helper: lấy Student từ userId hoặc studentId ─────────────────────────
  private async getStudent(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        OR: [{ userId }, { id: userId }],
      },
    });
    if (!student) {
      throw new ForbiddenException('Chỉ học sinh mới có quyền thực hiện thao tác này.');
    }
    return student;
  }

  // ─── 1. POST /homework — Tạo bài tập ──────────────────────────────────────
  async createHomework(userId: string, dto: CreateHomeworkDto) {
    const teacher = await this.getTeacher(userId);

    const classRecord = await this.prisma.class.findFirst({
      where: {
        class_code: dto.class_code,
        supervisorId: teacher.id,
        deleted: false,
      },
    });

    if (!classRecord) {
      throw new BadRequestException('Lớp học không tồn tại hoặc bạn không có quyền quản lý.');
    }

    const type = dto.type || 'original';
    const startTime = dto.startTime ? new Date(dto.startTime) : null;
    const endTime = dto.endTime || dto.deadline ? new Date((dto.endTime || dto.deadline)!) : null;
    const duration = dto.duration || 30;
    const maxAttempts = dto.maxAttempts || dto.attempts || 1;
    const studentViewPermission = (dto.studentViewPermission as any) || StudentViewPermissionEnum.NO_VIEW;
    const gradingMethod = (dto.gradingMethod as any) || GradingMethodEnum.FIRST_ATTEMPT;
    const blockViewAfterSubmit = dto.blockViewAfterSubmit || false;
    const isShuffleQuestions = dto.isShuffleQuestions || false;
    const isShuffleAnswers = dto.isShuffleAnswers || false;

    return await this.prisma.$transaction(async (tx) => {
      if (type === 'extracted' && dto.extractedQuestions && dto.extractedQuestions.length > 0) {
        // Tách câu tự động
        const totalPoints =
          dto.points ??
          Math.round(
            dto.extractedQuestions.reduce((sum, q) => sum + (q.point || 0), 0) * 100,
          ) / 100;

        const homework = await tx.homework.create({
          data: {
            title: dto.title,
            description: dto.description || `Bài tập trắc nghiệm tự động có ${dto.extractedQuestions.length} câu hỏi`,
            type: 'extracted',
            originalFileUrl: dto.originalFileUrl || dto.fileUrl,
            originalFileName: dto.originalFileName || dto.fileName,
            originalFileType: dto.originalFileType || dto.fileType,
            startTime,
            endTime,
            duration,
            maxAttempts,
            points: totalPoints,
            studentViewPermission,
            blockViewAfterSubmit,
            gradingMethod,
            isShuffleQuestions,
            isShuffleAnswers,
            classCode: classRecord.class_code,
            teacherId: teacher.id,
            ...(dto.fileUrl || dto.originalFileUrl
              ? {
                  attachments: {
                    create: {
                      name: dto.fileName || dto.originalFileName || 'Tài liệu đề bài',
                      url: dto.fileUrl || dto.originalFileUrl,
                      type: dto.fileType || dto.originalFileType || 'application/pdf',
                      size: 0,
                    },
                  },
                }
              : {}),
          },
          include: { attachments: true },
        });

        await tx.question.createMany({
          data: dto.extractedQuestions.map((q) => ({
            questionNumber: q.question_number,
            content: q.question_text,
            questionType: 'multiple_choice',
            options: q.options,
            answer: q.correct_answer_char,
            point: q.point ? Math.round(q.point * 100) / 100 : undefined,
            homeworkId: homework.id,
          })),
        });

        return homework;
      } else if (type === 'essay' && dto.essayQuestions && dto.essayQuestions.length > 0) {
        // Tự luận
        const totalPoints =
          dto.points ??
          Math.round(
            dto.essayQuestions.reduce((sum, q) => sum + (q.point || 0), 0) * 100,
          ) / 100;

        const homework = await tx.homework.create({
          data: {
            title: dto.title,
            description:
              dto.description ||
              `Bài tập tự luận có ${dto.essayQuestions.length} câu hỏi ${
                dto.source_type === 'file'
                  ? `từ file ${dto.source_name || ''}`
                  : `về chủ đề: ${dto.source_name || ''}`
              }`,
            type: 'essay',
            originalFileUrl: dto.source_type === 'file' ? (dto.originalFileUrl || dto.fileUrl) : undefined,
            originalFileName: dto.source_type === 'file' ? (dto.originalFileName || dto.fileName) : undefined,
            originalFileType: dto.source_type === 'file' ? (dto.originalFileType || dto.fileType) : undefined,
            content: JSON.stringify({
              source_type: dto.source_type || 'file',
              source_name: dto.source_name || '',
            }),
            startTime,
            endTime,
            duration,
            maxAttempts,
            points: totalPoints,
            studentViewPermission,
            blockViewAfterSubmit,
            gradingMethod,
            isShuffleQuestions: false,
            isShuffleAnswers: false,
            classCode: classRecord.class_code,
            teacherId: teacher.id,
            ...(dto.fileUrl || dto.originalFileUrl
              ? {
                  attachments: {
                    create: {
                      name: dto.fileName || dto.originalFileName || 'Tài liệu đề bài',
                      url: dto.fileUrl || dto.originalFileUrl,
                      type: dto.fileType || dto.originalFileType || 'application/pdf',
                      size: 0,
                    },
                  },
                }
              : {}),
          },
          include: { attachments: true },
        });

        await tx.question.createMany({
          data: dto.essayQuestions.map((q) => ({
            questionNumber: q.question_number,
            content: q.question_text,
            questionType: 'essay',
            options: [],
            answer: q.suggested_answer || '',
            point: q.point ? Math.round(q.point * 100) / 100 : undefined,
            homeworkId: homework.id,
          })),
        });

        return homework;
      } else {
        // Gốc (original) hoặc thông thường
        const questions = dto.questions || [];
        const totalPoints =
          dto.points ??
          Math.round(
            questions.reduce((sum, q) => sum + (q.point || 0), 0) * 100,
          ) / 100;

        const fileUrl = dto.fileUrl || dto.originalFileUrl;
        const fileName = dto.fileName || dto.originalFileName || 'Tài liệu đề bài';
        const fileType = dto.fileType || dto.originalFileType || 'application/pdf';

        const homework = await tx.homework.create({
          data: {
            title: dto.title,
            description: dto.description || `Bài tập có ${questions.length} câu hỏi`,
            type: type,
            originalFileUrl: fileUrl,
            originalFileName: fileName,
            originalFileType: fileType,
            startTime,
            endTime,
            duration,
            maxAttempts,
            points: totalPoints,
            studentViewPermission,
            blockViewAfterSubmit,
            gradingMethod,
            isShuffleQuestions,
            isShuffleAnswers,
            classCode: classRecord.class_code,
            teacherId: teacher.id,
            ...(fileUrl
              ? {
                  attachments: {
                    create: {
                      name: fileName,
                      url: fileUrl,
                      type: fileType,
                      size: 0,
                    },
                  },
                }
              : {}),
          },
          include: { attachments: true },
        });

        if (questions.length > 0) {
          await tx.question.createMany({
            data: questions.map((q, idx) => ({
              questionNumber: q.questionNumber ?? idx + 1,
              content: q.content || `Câu ${q.questionNumber ?? idx + 1}`,
              answer: q.answer || '',
              point: q.point ? Math.round(q.point * 100) / 100 : undefined,
              homeworkId: homework.id,
              options: q.options || (type === 'original' ? ['A', 'B', 'C', 'D'] : []),
              questionType: type === 'original' ? 'manual' : (q.questionType || 'multiple_choice'),
            })),
          });
        }

        return homework;
      }
    });
  }

  // ─── 2. GET /homework/:id — Lấy chi tiết bài tập ──────────────────────────
  async getHomeworkById(homeworkId: number, userId: string, role: string) {
    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        questions: {
          orderBy: { questionNumber: 'asc' },
        },
        attachments: true,
        class: true,
        subject: true,
      },
    });

    if (!homework) {
      throw new NotFoundException('Không tìm thấy bài tập.');
    }

    return homework;
  }

  // ─── 3. GET /homework/class/:classCode — Lấy danh sách bài tập lớp ────────
  async getClassHomeworks(classCode: string, userId: string, role: string) {
    const totalStudents = await this.prisma.student.count({
      where: {
        classes: {
          some: { class_code: classCode },
        },
      },
    });

    const homeworks = await this.prisma.homework.findMany({
      where: {
        class: { class_code: classCode },
      },
      include: {
        class: { select: { name: true, class_code: true } },
        subject: { select: { name: true } },
        attachments: true,
        submissions: {
          select: {
            studentId: true,
            grade: true,
          },
          distinct: ['studentId'],
        },
      },
      orderBy: { endTime: 'asc' },
    });

    return homeworks.map((hw) => ({
      ...hw,
      totalStudents,
      completedStudents: hw.submissions.length,
    }));
  }

  // ─── 4. PATCH /homework/:id/questions — Cập nhật câu hỏi ──────────────────
  async updateHomeworkQuestions(
    homeworkId: number,
    userId: string,
    dto: UpdateHomeworkQuestionsDto,
  ) {
    const teacher = await this.getTeacher(userId);

    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
      include: { questions: true },
    });

    if (!homework) {
      throw new NotFoundException('Không tìm thấy bài tập.');
    }

    if (homework.teacherId !== teacher.id) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài tập này.');
    }

    return await this.prisma.$transaction(async (tx) => {
      for (const q of dto.questions) {
        if (q.id) {
          await tx.question.update({
            where: { id: q.id },
            data: {
              questionNumber: q.questionNumber,
              content: q.content || `Câu ${q.questionNumber}`,
              answer: q.answer,
              point: q.point ?? undefined,
              options:
                q.options || (homework.type === 'original' ? ['A', 'B', 'C', 'D'] : []),
              questionType:
                homework.type === 'original' ? 'manual' : (q.questionType || 'multiple_choice'),
            },
          });
        }
      }

      const totalPoints = dto.questions.reduce((sum, q) => sum + (q.point || 0), 0);
      await tx.homework.update({
        where: { id: homeworkId },
        data: { points: totalPoints },
      });

      return { success: true };
    });
  }

  // ─── 5. PATCH /homework/:id/settings — Cập nhật cấu hình ──────────────────
  async updateHomeworkSettings(
    homeworkId: number,
    userId: string,
    dto: UpdateHomeworkSettingsDto,
  ) {
    const teacher = await this.getTeacher(userId);

    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
    });

    if (!homework) {
      throw new NotFoundException('Không tìm thấy bài tập.');
    }

    if (homework.teacherId !== teacher.id) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài tập này.');
    }

    const updated = await this.prisma.homework.update({
      where: { id: homeworkId },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.startTime ? { startTime: new Date(dto.startTime) } : {}),
        ...(dto.endTime ? { endTime: new Date(dto.endTime) } : {}),
        ...(dto.duration ? { duration: dto.duration } : {}),
        ...(dto.maxAttempts ? { maxAttempts: dto.maxAttempts } : {}),
        ...(dto.studentViewPermission ? { studentViewPermission: dto.studentViewPermission as any } : {}),
        ...(dto.blockViewAfterSubmit !== undefined ? { blockViewAfterSubmit: dto.blockViewAfterSubmit } : {}),
        ...(dto.gradingMethod ? { gradingMethod: dto.gradingMethod as any } : {}),
        ...(dto.isShuffleQuestions !== undefined ? { isShuffleQuestions: dto.isShuffleQuestions } : {}),
        ...(dto.isShuffleAnswers !== undefined ? { isShuffleAnswers: dto.isShuffleAnswers } : {}),
      },
    });

    return updated;
  }

  // ─── 6. DELETE /homework/:id — Xóa bài tập ────────────────────────────────
  async deleteHomework(homeworkId: number, userId: string) {
    const teacher = await this.getTeacher(userId);

    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
    });

    if (!homework) {
      throw new NotFoundException('Không tìm thấy bài tập.');
    }

    if (homework.teacherId !== teacher.id) {
      throw new ForbiddenException('Bạn không có quyền xóa bài tập này.');
    }

    await this.prisma.homework.delete({
      where: { id: homeworkId },
    });

    return { success: true, message: 'Đã xóa bài tập thành công.' };
  }

  // ─── 7. POST /homework/:id/save — Lưu nháp bài làm ────────────────────────
  async saveDraft(homeworkId: number, userId: string, dto: SaveDraftDto) {
    const student = await this.getStudent(userId);

    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
    });

    if (!homework) {
      throw new NotFoundException('Không tìm thấy bài tập.');
    }

    let submission = await this.prisma.homeworkSubmission.findFirst({
      where: {
        homeworkId,
        studentId: student.id,
        grade: null,
      },
    });

    if (!submission) {
      submission = await this.prisma.homeworkSubmission.create({
        data: {
          homeworkId,
          studentId: student.id,
          content: JSON.stringify(dto.answers || {}),
          attemptNumber: 1,
          submittedAt: new Date(),
          timeSpent: 0,
        },
      });
    } else {
      submission = await this.prisma.homeworkSubmission.update({
        where: { id: submission.id },
        data: {
          content: JSON.stringify(dto.answers || {}),
          submittedAt: new Date(),
        },
      });
    }

    return {
      submissionId: submission.id,
      message: dto.isPartial ? 'Đã lưu bản nháp' : 'Đã lưu bài làm',
    };
  }

  // ─── 8. POST /homework/:id/submit — Nộp bài (học sinh / làm thử giáo viên) 
  async submitHomework(
    homeworkId: number,
    userId: string,
    userRole: string,
    dto: SubmitHomeworkDto,
  ) {
    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
      include: { questions: true },
    });

    if (!homework) {
      throw new NotFoundException('Không tìm thấy bài tập.');
    }

    const isTeacher = userRole === 'teacher' || dto.role === 'teacher';

    // Xử lý giáo viên làm thử (không lưu DB)
    if (isTeacher) {
      let totalPoints = 0;
      const questionAnswers: Array<{ questionId: number; answer: string; isCorrect: boolean }> = [];

      homework.questions.forEach((q) => {
        const studentAnswer = dto.answers?.[q.id] || dto.answers?.[q.questionNumber || 0];
        const isCorrect = studentAnswer === q.answer;
        if (isCorrect) {
          totalPoints += q.point || 0;
        }
        questionAnswers.push({
          questionId: q.id,
          answer: studentAnswer || '',
          isCorrect,
        });
      });

      return {
        isTeacher: true,
        totalPoints: Math.round(totalPoints * 100) / 100,
        questionAnswers,
        message: 'Kết quả làm thử của giáo viên (không lưu vào hệ thống)',
      };
    }

    // Xử lý học sinh nộp bài
    const student = await this.getStudent(userId);

    // Kiểm tra số lần nộp bài
    const submissionCount = await this.prisma.homeworkSubmission.count({
      where: {
        homeworkId,
        studentId: student.id,
        attemptNumber: { gt: 0 },
        ...(homework.type === 'essay' ? {} : { grade: { not: null } }),
      },
    });

    const maxAttempts = homework.maxAttempts || 1;
    if (submissionCount >= maxAttempts) {
      throw new BadRequestException('Đã hết lượt làm bài.');
    }

    let totalPoints = 0;
    const questionAnswers: Array<{ questionId: number; answer: string; isCorrect: boolean }> = [];

    // Nếu là trắc nghiệm thì chấm tự động
    if (homework.type !== 'essay') {
      homework.questions.forEach((q) => {
        const studentAnswer = dto.answers?.[q.id] || dto.answers?.[q.questionNumber || 0];
        const isCorrect = studentAnswer === q.answer;
        if (isCorrect) {
          totalPoints += q.point || 0;
        }
        questionAnswers.push({
          questionId: q.id,
          answer: studentAnswer || '',
          isCorrect,
        });
      });
    }

    const calculatedGrade =
      homework.type === 'essay' ? null : Math.round(totalPoints * 100) / 100;

    // Tìm submission nháp hoặc tạo mới
    const existingDraft = await this.prisma.homeworkSubmission.findFirst({
      where: {
        homeworkId,
        studentId: student.id,
        grade: null,
      },
    });

    let submission;
    if (existingDraft && homework.type === 'essay') {
      submission = await this.prisma.homeworkSubmission.update({
        where: { id: existingDraft.id },
        data: {
          content: JSON.stringify(dto.answers || {}),
          attemptNumber: submissionCount + 1,
          submittedAt: new Date(),
          timeSpent: dto.timeSpent || 0,
          grade: calculatedGrade,
          violationCount: dto.violationCount || 0,
        },
      });
    } else {
      submission = await this.prisma.homeworkSubmission.create({
        data: {
          content: JSON.stringify(dto.answers || {}),
          attemptNumber: submissionCount + 1,
          timeSpent: dto.timeSpent || 0,
          submittedAt: new Date(),
          homework: { connect: { id: homeworkId } },
          student: { connect: { id: student.id } },
          grade: calculatedGrade,
          violationCount: dto.violationCount || 0,
          ...(questionAnswers.length > 0
            ? {
                questionAnswers: {
                  create: questionAnswers,
                },
              }
            : {}),
          ...(dto.file
            ? {
                attachments: {
                  create: {
                    name: dto.file.name,
                    type: dto.file.type,
                    url: dto.file.url,
                    size: dto.file.size || 0,
                  },
                },
              }
            : {}),
        },
      });
    }

    return {
      submissionId: submission.id,
      submission,
      grade: calculatedGrade,
      message:
        homework.type === 'essay'
          ? 'Nộp bài thành công. Chờ giáo viên chấm điểm.'
          : 'Nộp bài thành công',
    };
  }

  // ─── 9. POST /homework/:id/grade — Chấm điểm bài nộp (Giáo viên) ──────────
  async gradeSubmission(
    homeworkId: number,
    userId: string,
    dto: GradeSubmissionDto,
  ) {
    const teacher = await this.getTeacher(userId);

    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
    });

    if (!homework) {
      throw new NotFoundException('Không tìm thấy bài tập.');
    }

    if (homework.teacherId !== teacher.id) {
      throw new ForbiddenException('Bạn không có quyền chấm bài tập này.');
    }

    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: { id: dto.submissionId },
    });

    if (!submission) {
      throw new NotFoundException('Không tìm thấy bài làm của học sinh.');
    }

    // Merge answers với question grades
    let currentContent: any = {};
    try {
      if (submission.content) {
        currentContent =
          typeof submission.content === 'string'
            ? JSON.parse(submission.content)
            : submission.content;
      }
    } catch (e) {
      this.logger.error('Error parsing submission content:', e);
    }

    if (dto.questionGrades) {
      Object.entries(dto.questionGrades).forEach(([qId, score]) => {
        if (typeof currentContent[qId] === 'string') {
          const answerText = currentContent[qId];
          currentContent[qId] = {
            answer: answerText,
            score: Number(score),
            feedback: null,
          };
        } else if (typeof currentContent[qId] === 'object' && currentContent[qId] !== null) {
          currentContent[qId].score = Number(score);
        } else {
          currentContent[qId] = {
            score: Number(score),
            feedback: null,
          };
        }
      });
    }

    const updatedSubmission = await this.prisma.homeworkSubmission.update({
      where: { id: dto.submissionId },
      data: {
        grade: Number(dto.grade),
        feedback: dto.feedback || null,
        content: JSON.stringify(currentContent),
      },
    });

    return {
      message: 'Đã chấm điểm thành công',
      submission: updatedSubmission,
    };
  }

  // ─── 10. GET /homework/submissions/count — Đếm số lượt làm & điểm tốt nhất 
  async getSubmissionsCount(homeworkId: number, userId: string) {
    const student = await this.getStudent(userId);

    const count = await this.prisma.homeworkSubmission.count({
      where: {
        homeworkId,
        studentId: student.id,
      },
    });

    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
      select: {
        studentViewPermission: true,
        gradingMethod: true,
        endTime: true,
      },
    });

    if (!homework) {
      throw new NotFoundException('Không tìm thấy bài tập.');
    }

    const isExpired = homework.endTime ? new Date() > new Date(homework.endTime) : false;
    const canViewScore = homework.studentViewPermission !== 'NO_VIEW' || isExpired;

    let currentSubmission: { id: number; grade: number | null } | null = null;
    if (canViewScore) {
      let orderBy: any;
      switch (homework.gradingMethod) {
        case 'FIRST_ATTEMPT':
          orderBy = { submittedAt: 'asc' };
          break;
        case 'LATEST_ATTEMPT':
          orderBy = { submittedAt: 'desc' };
          break;
        case 'HIGHEST_ATTEMPT':
        default:
          orderBy = { grade: 'desc' };
          break;
      }

      currentSubmission = await this.prisma.homeworkSubmission.findFirst({
        where: {
          homeworkId,
          studentId: student.id,
          grade: { not: null },
        },
        orderBy,
        select: {
          id: true,
          grade: true,
        },
      });
    }

    return {
      count,
      bestSubmissionId: canViewScore ? (currentSubmission?.id || null) : null,
      bestGrade: canViewScore ? (currentSubmission?.grade || null) : null,
    };
  }

  // ─── 11. GET /homework/submissions/detail — Chi tiết bài nộp ──────────────
  async getSubmissionDetail(query: SubmissionDetailQueryDto, userId: string, role: string) {
    if (query.utid) {
      const submission = await this.prisma.homeworkSubmission.findUnique({
        where: { id: Number(query.utid) },
        include: {
          questionAnswers: {
            include: { question: true },
          },
          attachments: true,
          homework: {
            include: {
              attachments: true,
              questions: true,
            },
          },
          student: true,
        },
      });

      if (!submission) {
        throw new NotFoundException('Không tìm thấy bài làm.');
      }

      return submission;
    }

    if (query.homeworkId && (query.studentId || userId)) {
      const studentId = query.studentId || userId;
      const student = await this.prisma.student.findFirst({
        where: {
          OR: [{ userId: studentId }, { id: studentId }],
        },
      });

      const submission = await this.prisma.homeworkSubmission.findFirst({
        where: {
          homeworkId: Number(query.homeworkId),
          studentId: student?.id || studentId,
          grade: { not: null },
        },
        include: {
          questionAnswers: {
            include: { question: true },
          },
          attachments: true,
          homework: {
            include: {
              attachments: true,
              questions: true,
            },
          },
          student: true,
        },
        orderBy: {
          grade: 'desc',
        },
      });

      if (!submission) {
        throw new NotFoundException('Không tìm thấy bài làm nào đã được chấm điểm.');
      }

      return submission;
    }

    throw new BadRequestException('Thiếu thông tin bài làm. Cần utid hoặc homeworkId.');
  }

  // ─── 12. GET /homework/:id/teacher-detail — Xem bài nộp của cả lớp (GV) ───
  async getTeacherDetail(homeworkId: number, userId: string) {
    const teacher = await this.getTeacher(userId);

    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        questions: true,
        attachments: true,
        class: true,
        subject: true,
      },
    });

    if (!homework) {
      throw new NotFoundException('Không tìm thấy bài tập.');
    }

    if (homework.teacherId !== teacher.id) {
      throw new ForbiddenException('Bạn không có quyền xem thông tin bài tập này.');
    }

    const submissions = await this.prisma.homeworkSubmission.findMany({
      where: { homeworkId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const classInfo = homework.classCode
      ? await this.prisma.class.findUnique({
          where: { class_code: homework.classCode },
          include: {
            students: {
              include: {
                user: true,
              },
            },
          },
        })
      : null;

    return {
      homework,
      submissions,
      allStudents: classInfo?.students || [],
      classId: homework.classCode,
    };
  }

  // ─── 13. GET /homework/:id/download — Thông tin tải file đề gốc ───────────
  async getDownloadInfo(homeworkId: number, userId: string, role: string) {
    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
      select: {
        id: true,
        title: true,
        originalFileUrl: true,
        originalFileName: true,
        originalFileType: true,
        teacherId: true,
        class: {
          select: {
            class_code: true,
            students: { select: { id: true, userId: true } },
          },
        },
      },
    });

    if (!homework) {
      throw new NotFoundException('Không tìm thấy bài tập.');
    }

    if (!homework.originalFileUrl) {
      throw new NotFoundException('Không có file đề bài để tải về.');
    }

    return {
      fileUrl: homework.originalFileUrl,
      fileName: homework.originalFileName || `${homework.title}.pdf`,
      fileType: homework.originalFileType || 'application/pdf',
    };
  }

  // ─── 14. GET /homework/:id/export — Xuất file Excel nộp bài ───────────────
  async exportSubmissions(homeworkId: number, userId: string, res: Response) {
    const teacher = await this.getTeacher(userId);

    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
    });

    if (!homework || homework.teacherId !== teacher.id) {
      throw new ForbiddenException('Bạn không có quyền xuất dữ liệu bài tập này.');
    }

    const submissions = await this.prisma.homeworkSubmission.findMany({
      where: {
        homeworkId,
        attemptNumber: { gt: 0 },
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Lọc lấy bài nộp cuối cùng của mỗi học sinh
    const latestSubmissions = submissions.reduce((acc, submission) => {
      const studentId = submission.studentId;
      if (
        !acc[studentId] ||
        new Date(submission.submittedAt) > new Date(acc[studentId].submittedAt)
      ) {
        acc[studentId] = submission;
      }
      return acc;
    }, {} as Record<string, (typeof submissions)[0]>);

    const finalSubmissions = Object.values(latestSubmissions).sort(
      (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Danh sách nộp bài');

    sheet.addRow([
      'STT',
      'Họ và tên',
      'Vai trò',
      'Trường',
      'Lớp',
      'Điểm',
      'Thời gian làm bài (phút)',
      'Thời gian nộp bài',
    ]);

    finalSubmissions.forEach((sub, idx) => {
      const u = sub.student?.user;
      sheet.addRow([
        idx + 1,
        u?.username || '',
        'Học sinh',
        u?.schoolname || '',
        u?.class_name || '',
        sub.grade ?? '',
        sub.timeSpent ? Math.round(sub.timeSpent / 60) : '',
        sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('vi-VN') : '',
      ]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=homework_${homeworkId}_export.xlsx`,
    );
    res.send(Buffer.from(buffer));
  }

  // ─── 15. GET /homework/student/overview ─────────────────────────────────────
  async getStudentOverview(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        OR: [{ id: userId }, { userId }],
      },
      include: {
        classes: {
          include: {
            supervisor: {
              include: { user: true },
            },
            homeworks: {
              orderBy: { createdAt: 'asc' },
              include: {
                attachments: { take: 1 },
                submissions: {
                  where: {
                    OR: [{ studentId: userId }, { student: { userId } }],
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      return {
        pendingHomeworks: [],
        classResults: [],
      };
    }

    const allHomeworks = student.classes.flatMap((classInfo) =>
      classInfo.homeworks.map((hw) => ({
        ...hw,
        className: classInfo.name,
        classCode: classInfo.class_code,
      })),
    );

    const now = new Date();
    const pendingHomeworks = allHomeworks
      .filter((hw) => {
        const hasSubmission = hw.submissions.length > 0;
        const isExpired = hw.endTime && now > new Date(hw.endTime);
        return !hasSubmission && !isExpired;
      })
      .map((hw) => {
        const fileType = hw.attachments?.[0]?.type || '';
        const attachmentImage = fileType.includes('pdf')
          ? '/pdf_red.png'
          : '/doc_blue.png';

        return {
          id: hw.id,
          title: hw.title,
          className: hw.className,
          classCode: hw.classCode,
          endTime: hw.endTime,
          attachmentImage,
        };
      });

    const classResults = student.classes.map((classInfo) => {
      const homeworksWithHighestGrade = classInfo.homeworks.map((hw) => {
        const isExpired = hw.endTime ? now > new Date(hw.endTime) : false;
        const canViewScore = hw.studentViewPermission !== 'NO_VIEW' || isExpired;

        if (hw.submissions.length === 0 || !canViewScore) {
          return {
            title: hw.title,
            grade: null,
            submittedAt: null,
          };
        }

        const highestSubmission = hw.submissions.reduce((max, sub) => {
          if (sub.grade === null) return max;
          if (max.grade === null) return sub;
          return sub.grade > max.grade ? sub : max;
        });

        return {
          title: hw.title,
          grade: highestSubmission.grade,
          submittedAt: highestSubmission.submittedAt,
        };
      });

      const gradedHomeworks = homeworksWithHighestGrade.filter(
        (hw) => hw.grade !== null,
      );

      const averageGrade =
        gradedHomeworks.length > 0
          ? (
              gradedHomeworks.reduce((sum, hw) => sum + (hw.grade || 0), 0) /
              gradedHomeworks.length
            ).toFixed(2)
          : 'Chưa có điểm';

      const totalHomeworks = classInfo.homeworks.length;
      const completedHomeworks = classInfo.homeworks.filter(
        (hw) => hw.submissions.length > 0,
      ).length;
      const completionRate =
        totalHomeworks > 0
          ? Math.round((completedHomeworks / totalHomeworks) * 100)
          : 0;

      const teacherName =
        classInfo.supervisor?.user?.username ||
        'Chưa có giáo viên';

      return {
        className: classInfo.name,
        teacherName,
        averageGrade,
        completionRate,
        totalHomeworks,
        completedHomeworks,
        chartData: homeworksWithHighestGrade.filter((hw) => hw.submittedAt),
        tableData: homeworksWithHighestGrade,
      };
    });

    return {
      pendingHomeworks,
      classResults,
    };
  }

  // ─── 16. GET /homework/class/:classCode/scoretable ─────────────────────────
  async getScoreTable(classCode: string, userId: string, role: string) {
    let currentStudentId: string | undefined = undefined;

    if (role === 'teacher') {
      const teacher = await this.prisma.teacher.findFirst({
        where: { OR: [{ id: userId }, { userId }] },
      });
      if (teacher) {
        const classAccess = await this.prisma.class.findFirst({
          where: { class_code: classCode, supervisorId: teacher.id },
        });
        if (!classAccess) {
          throw new ForbiddenException('Bạn không có quyền truy cập lớp học này.');
        }
      }
    } else if (role === 'student') {
      const student = await this.prisma.student.findFirst({
        where: { OR: [{ id: userId }, { userId }] },
      });
      if (student) {
        const classAccess = await this.prisma.class.findFirst({
          where: {
            class_code: classCode,
            students: { some: { id: student.id } },
          },
        });
        if (!classAccess) {
          throw new ForbiddenException('Bạn không có quyền truy cập lớp học này.');
        }
        currentStudentId = student.id;
      }
    }

    const [classInfo, homeworks, students, allSubmissions] = await Promise.all([
      this.prisma.class.findUnique({
        where: { class_code: classCode },
        select: { id: true, name: true, class_code: true },
      }),
      this.prisma.homework.findMany({
        where: { classCode },
        select: {
          id: true,
          title: true,
          points: true,
          gradingMethod: true,
          studentViewPermission: true,
          endTime: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.student.findMany({
        where: { classes: { some: { class_code: classCode } } },
        include: { user: true },
        orderBy: { user: { username: 'asc' } },
      }),
      this.prisma.homeworkSubmission.findMany({
        where: { homework: { classCode } },
        select: {
          studentId: true,
          homeworkId: true,
          grade: true,
          submittedAt: true,
        },
        orderBy: { submittedAt: 'asc' },
      }),
    ]);

    if (!classInfo) {
      throw new NotFoundException('Không tìm thấy lớp học.');
    }

    const now = new Date();
    const canStudentViewHomeworkScore = (hw: {
      studentViewPermission: string | null;
      endTime: Date | null;
    }) => {
      if (role === 'teacher') return true;
      const isExpired = hw.endTime ? now > new Date(hw.endTime) : false;
      if (hw.studentViewPermission === 'NO_VIEW') {
        return isExpired;
      }
      return true;
    };

    const getScoreByGradingMethod = (
      studentId: string,
      homeworkId: number,
      gradingMethod: string | null,
    ) => {
      const studentSubmissions = allSubmissions.filter(
        (sub) =>
          sub.studentId === studentId &&
          sub.homeworkId === homeworkId &&
          sub.grade !== null,
      );

      if (studentSubmissions.length === 0) return null;

      switch (gradingMethod) {
        case 'FIRST_ATTEMPT':
          return studentSubmissions[0].grade;
        case 'LATEST_ATTEMPT':
          return studentSubmissions[studentSubmissions.length - 1].grade;
        case 'HIGHEST_ATTEMPT':
        default:
          return Math.max(...studentSubmissions.map((sub) => sub.grade!));
      }
    };

    const studentScores = students.map((student) => {
      const homeworkScores: { [homeworkId: string]: number | null } = {};
      let totalPoints = 0;
      let gradedHomeworks = 0;

      homeworks.forEach((homework) => {
        const canView = canStudentViewHomeworkScore(homework);
        const score = canView
          ? getScoreByGradingMethod(
              student.id,
              homework.id,
              homework.gradingMethod,
            )
          : null;

        if (score !== null) {
          homeworkScores[homework.id.toString()] = score;
          totalPoints += score;
          gradedHomeworks++;
        } else {
          homeworkScores[homework.id.toString()] = null;
        }
      });

      const average = gradedHomeworks > 0 ? totalPoints / gradedHomeworks : 0;
      return {
        id: student.id,
        username: student.user?.username || '',
        schoolname: student.user?.schoolname || null,
        class_name: student.user?.class_name || null,
        homeworkScores,
        average,
      };
    });

    studentScores.sort((a, b) => b.average - a.average);

    const chartData = homeworks.map((homework) => {
      let totalScore = 0;
      let scoreCount = 0;
      studentScores.forEach((student) => {
        const score = student.homeworkScores[homework.id];
        if (score !== null) {
          totalScore += score;
          scoreCount++;
        }
      });
      const average = scoreCount > 0 ? totalScore / scoreCount : 0;

      return {
        name:
          homework.title.length > 15
            ? homework.title.substring(0, 15) + '...'
            : homework.title,
        'Điểm TB': parseFloat(average.toFixed(1)),
      };
    });

    return {
      classInfo,
      homeworks,
      studentScores,
      chartData,
      currentStudentId,
    };
  }
}
