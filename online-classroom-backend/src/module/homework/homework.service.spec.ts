import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../lib/database/prisma.service';
import { HomeworkService } from './homework.service';

// ─── Mock data ───────────────────────────────────────────────────────────────

const mockTeacher = { id: 'teacher-id-1', userId: 'user-teacher-1' };
const mockStudent = { id: 'student-id-1', userId: 'user-student-1' };

const mockClass = {
  id: 1,
  class_code: 'CLS01',
  supervisorId: mockTeacher.id,
  deleted: false,
};

const mockHomework = {
  id: 1,
  title: 'Bài kiểm tra Toán',
  description: 'Mô tả',
  type: 'original',
  classCode: 'CLS01',
  teacherId: mockTeacher.id,
  points: 10,
  maxAttempts: 1,
  duration: 45,
  startTime: null,
  endTime: null,
  studentViewPermission: 'NO_VIEW',
  gradingMethod: 'HIGHEST_ATTEMPT',
  blockViewAfterSubmit: false,
  isShuffleQuestions: false,
  isShuffleAnswers: false,
  questions: [
    {
      id: 1,
      questionNumber: 1,
      content: 'Câu 1',
      answer: 'A',
      point: 2.5,
      options: ['A', 'B', 'C', 'D'],
      questionType: 'multiple_choice',
    },
    {
      id: 2,
      questionNumber: 2,
      content: 'Câu 2',
      answer: 'B',
      point: 2.5,
      options: ['A', 'B', 'C', 'D'],
      questionType: 'multiple_choice',
    },
  ],
  attachments: [],
};

const mockSubmission = {
  id: 10,
  homeworkId: mockHomework.id,
  studentId: mockStudent.id,
  content: JSON.stringify({ 1: 'A', 2: 'B' }),
  grade: null,
  attemptNumber: 1,
  submittedAt: new Date(),
  timeSpent: 0,
  feedback: null,
};

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('HomeworkService', () => {
  let service: HomeworkService;

  const mockPrisma = {
    teacher: { findFirst: jest.fn() },
    student: { findFirst: jest.fn(), count: jest.fn() },
    class: { findFirst: jest.fn() },
    homework: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    question: {
      findUnique: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
    homeworkSubmission: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeworkService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<HomeworkService>(HomeworkService);
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // createHomework()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('createHomework()', () => {
    const baseDto = {
      title: 'Bài kiểm tra Toán',
      class_code: 'CLS01',
      duration: 45,
      maxAttempts: 1,
    };

    it('tạo bài tập type=original thành công', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(mockTeacher);
      mockPrisma.class.findFirst.mockResolvedValue(mockClass);

      const createdHw = { ...mockHomework };
      mockPrisma.$transaction.mockImplementation((cb: any) => {
        const tx = {
          homework: { create: jest.fn().mockResolvedValue(createdHw) },
          question: { createMany: jest.fn() },
        };
        return cb(tx);
      });

      const result = await service.createHomework(mockTeacher.userId, {
        ...baseDto,
        type: 'original',
        questions: [],
      });

      expect(result.title).toBe('Bài kiểm tra Toán');
    });

    it('tạo bài tập type=extracted (trắc nghiệm tự động) thành công', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(mockTeacher);
      mockPrisma.class.findFirst.mockResolvedValue(mockClass);

      const extractedHw = { ...mockHomework, type: 'extracted', points: 10 };
      const mockCreate = jest.fn().mockResolvedValue(extractedHw);
      const mockCreateMany = jest.fn();

      mockPrisma.$transaction.mockImplementation((cb: any) => {
        return cb({
          homework: { create: mockCreate },
          question: { createMany: mockCreateMany },
        });
      });

      const result = await service.createHomework(mockTeacher.userId, {
        ...baseDto,
        type: 'extracted',
        extractedQuestions: [
          {
            question_number: 1,
            question_text: 'Câu 1',
            options: ['A', 'B', 'C', 'D'],
            correct_answer_char: 'A',
            point: 5,
          },
          {
            question_number: 2,
            question_text: 'Câu 2',
            options: ['A', 'B', 'C', 'D'],
            correct_answer_char: 'B',
            point: 5,
          },
        ],
      });

      expect(mockCreateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ answer: 'A' }),
            expect.objectContaining({ answer: 'B' }),
          ]),
        }),
      );
    });

    it('tạo bài tập type=essay (tự luận) thành công', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(mockTeacher);
      mockPrisma.class.findFirst.mockResolvedValue(mockClass);

      const essayHw = { ...mockHomework, type: 'essay' };
      const mockCreate = jest.fn().mockResolvedValue(essayHw);
      const mockCreateMany = jest.fn();

      mockPrisma.$transaction.mockImplementation((cb: any) => {
        return cb({
          homework: { create: mockCreate },
          question: { createMany: mockCreateMany },
        });
      });

      await service.createHomework(mockTeacher.userId, {
        ...baseDto,
        type: 'essay',
        essayQuestions: [
          {
            question_number: 1,
            question_text: 'Giải thích...',
            suggested_answer: 'Câu trả lời mẫu',
            point: 10,
          },
        ],
      });

      expect(mockCreateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ questionType: 'essay' }),
          ]),
        }),
      );
    });

    it('throw ForbiddenException khi không phải teacher', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(null);

      await expect(
        service.createHomework('student-user', baseDto as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throw BadRequestException khi lớp không tồn tại hoặc không có quyền', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(mockTeacher);
      mockPrisma.class.findFirst.mockResolvedValue(null);

      await expect(
        service.createHomework(mockTeacher.userId, baseDto as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createHomework(mockTeacher.userId, baseDto as any),
      ).rejects.toThrow(
        'Lớp học không tồn tại hoặc bạn không có quyền quản lý.',
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getHomeworkById()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('getHomeworkById()', () => {
    it('trả về bài tập theo id', async () => {
      mockPrisma.homework.findUnique.mockResolvedValue(mockHomework);

      const result = await service.getHomeworkById(
        1,
        mockTeacher.userId,
        'teacher',
      );

      expect(result).toEqual(mockHomework);
      expect(mockPrisma.homework.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });

    it('throw NotFoundException khi bài tập không tồn tại', async () => {
      mockPrisma.homework.findUnique.mockResolvedValue(null);

      await expect(
        service.getHomeworkById(999, mockTeacher.userId, 'teacher'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getHomeworkById(999, mockTeacher.userId, 'teacher'),
      ).rejects.toThrow('Không tìm thấy bài tập.');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // deleteHomework()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('deleteHomework()', () => {
    it('xóa bài tập thành công', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(mockTeacher);
      mockPrisma.homework.findUnique.mockResolvedValue(mockHomework);
      mockPrisma.homework.delete.mockResolvedValue(mockHomework);

      const result = await service.deleteHomework(1, mockTeacher.userId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Đã xóa bài tập thành công.');
      expect(mockPrisma.homework.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('throw ForbiddenException khi không phải teacher', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(null);

      await expect(service.deleteHomework(1, 'invalid')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throw NotFoundException khi bài tập không tồn tại', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(mockTeacher);
      mockPrisma.homework.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteHomework(999, mockTeacher.userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throw ForbiddenException khi teacher không phải chủ bài tập', async () => {
      const otherTeacher = { id: 'other-teacher', userId: 'other-user' };
      mockPrisma.teacher.findFirst.mockResolvedValue(otherTeacher);
      mockPrisma.homework.findUnique.mockResolvedValue(mockHomework);

      await expect(service.deleteHomework(1, 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.deleteHomework(1, 'other-user')).rejects.toThrow(
        'Bạn không có quyền xóa bài tập này.',
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // updateHomeworkSettings()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('updateHomeworkSettings()', () => {
    const settingsDto = { title: 'Bài kiểm tra Updated', duration: 60 };

    it('cập nhật cấu hình bài tập thành công', async () => {
      const updatedHw = {
        ...mockHomework,
        title: 'Bài kiểm tra Updated',
        duration: 60,
      };
      mockPrisma.teacher.findFirst.mockResolvedValue(mockTeacher);
      mockPrisma.homework.findUnique.mockResolvedValue(mockHomework);
      mockPrisma.homework.update.mockResolvedValue(updatedHw);

      const result = await service.updateHomeworkSettings(
        1,
        mockTeacher.userId,
        settingsDto,
      );

      expect(result.title).toBe('Bài kiểm tra Updated');
      expect(result.duration).toBe(60);
    });

    it('throw ForbiddenException khi không phải teacher', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(null);

      await expect(
        service.updateHomeworkSettings(1, 'invalid', settingsDto as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throw NotFoundException khi bài tập không tồn tại', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(mockTeacher);
      mockPrisma.homework.findUnique.mockResolvedValue(null);

      await expect(
        service.updateHomeworkSettings(
          999,
          mockTeacher.userId,
          settingsDto as any,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throw ForbiddenException khi teacher không phải chủ bài tập', async () => {
      const otherTeacher = { id: 'other-teacher', userId: 'other-user' };
      mockPrisma.teacher.findFirst.mockResolvedValue(otherTeacher);
      mockPrisma.homework.findUnique.mockResolvedValue(mockHomework);

      await expect(
        service.updateHomeworkSettings(1, 'other-user', settingsDto as any),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateHomeworkSettings(1, 'other-user', settingsDto as any),
      ).rejects.toThrow('Bạn không có quyền chỉnh sửa bài tập này.');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // updateHomeworkQuestions()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('updateHomeworkQuestions()', () => {
    const questionsDto = {
      questions: [
        {
          id: 1,
          questionNumber: 1,
          content: 'Câu 1 Updated',
          answer: 'B',
          point: 5,
        },
      ],
    };

    it('cập nhật câu hỏi thành công', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(mockTeacher);
      mockPrisma.homework.findUnique.mockResolvedValue({
        ...mockHomework,
        questions: [],
      });
      mockPrisma.$transaction.mockImplementation((cb: any) => {
        const tx = {
          question: { update: jest.fn() },
          homework: { update: jest.fn() },
        };
        return cb(tx);
      });

      const result = await service.updateHomeworkQuestions(
        1,
        mockTeacher.userId,
        questionsDto,
      );

      expect(result.success).toBe(true);
    });

    it('throw ForbiddenException khi không phải teacher', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(null);

      await expect(
        service.updateHomeworkQuestions(1, 'invalid', questionsDto as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throw NotFoundException khi bài tập không tồn tại', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(mockTeacher);
      mockPrisma.homework.findUnique.mockResolvedValue(null);

      await expect(
        service.updateHomeworkQuestions(
          999,
          mockTeacher.userId,
          questionsDto as any,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // saveDraft()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('saveDraft()', () => {
    it('tạo mới draft khi chưa có submission', async () => {
      mockPrisma.student.findFirst.mockResolvedValue(mockStudent);
      mockPrisma.homework.findUnique.mockResolvedValue(mockHomework);
      mockPrisma.homeworkSubmission.findFirst.mockResolvedValue(null); // chưa có draft
      mockPrisma.homeworkSubmission.create.mockResolvedValue({
        ...mockSubmission,
        id: 99,
      });

      const result = await service.saveDraft(1, mockStudent.userId, {
        answers: { 1: 'A' },
      });

      expect(result.submissionId).toBe(99);
      expect(mockPrisma.homeworkSubmission.create).toHaveBeenCalled();
    });

    it('cập nhật draft nếu đã có submission', async () => {
      mockPrisma.student.findFirst.mockResolvedValue(mockStudent);
      mockPrisma.homework.findUnique.mockResolvedValue(mockHomework);
      mockPrisma.homeworkSubmission.findFirst.mockResolvedValue(mockSubmission); // đã có draft
      mockPrisma.homeworkSubmission.update.mockResolvedValue({
        ...mockSubmission,
        id: 10,
      });

      const result = await service.saveDraft(1, mockStudent.userId, {
        answers: { 1: 'A', 2: 'B' },
        isPartial: true,
      });

      expect(result.submissionId).toBe(10);
      expect(result.message).toBe('Đã lưu bản nháp');
      expect(mockPrisma.homeworkSubmission.update).toHaveBeenCalled();
    });

    it('throw ForbiddenException khi không phải student', async () => {
      mockPrisma.student.findFirst.mockResolvedValue(null);

      await expect(
        service.saveDraft(1, 'invalid', { answers: {} } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throw NotFoundException khi bài tập không tồn tại', async () => {
      mockPrisma.student.findFirst.mockResolvedValue(mockStudent);
      mockPrisma.homework.findUnique.mockResolvedValue(null);

      await expect(
        service.saveDraft(999, mockStudent.userId, { answers: {} } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // submitHomework()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('submitHomework()', () => {
    it('teacher làm thử → không lưu DB, trả về kết quả tức thì', async () => {
      mockPrisma.homework.findUnique.mockResolvedValue(mockHomework);

      const result = await service.submitHomework(
        1,
        mockTeacher.userId,
        'teacher',
        {
          answers: { 1: 'A', 2: 'B' }, // cả 2 đúng
        },
      );

      expect(result.isTeacher).toBe(true);
      expect(result.message).toContain('không lưu vào hệ thống');
      expect(mockPrisma.homeworkSubmission.create).not.toHaveBeenCalled();
    });

    it('teacher làm thử — tính đúng số điểm', async () => {
      mockPrisma.homework.findUnique.mockResolvedValue(mockHomework);

      const result = await service.submitHomework(
        1,
        mockTeacher.userId,
        'teacher',
        {
          answers: { 1: 'A', 2: 'C' }, // câu 1 đúng (A), câu 2 sai (đáp án B)
          role: 'teacher',
        },
      );

      expect(result.totalPoints).toBe(2.5); // chỉ câu 1 đúng
    });

    it('student nộp bài thành công (trắc nghiệm → chấm tự động)', async () => {
      mockPrisma.homework.findUnique.mockResolvedValue(mockHomework);
      mockPrisma.student.findFirst.mockResolvedValue(mockStudent);
      mockPrisma.homeworkSubmission.count.mockResolvedValue(0); // chưa nộp lần nào
      mockPrisma.homeworkSubmission.findFirst.mockResolvedValue(null); // không có draft
      mockPrisma.homeworkSubmission.create.mockResolvedValue({
        ...mockSubmission,
        grade: 5,
      });

      const result = await service.submitHomework(
        1,
        mockStudent.userId,
        'student',
        {
          answers: { 1: 'A', 2: 'B' }, // cả 2 đúng = 5 điểm
        },
      );

      expect(result.grade).toBe(5); // 2.5 + 2.5
      expect(result.message).toBe('Nộp bài thành công');
    });

    it('throw NotFoundException khi bài tập không tồn tại', async () => {
      mockPrisma.homework.findUnique.mockResolvedValue(null);

      await expect(
        service.submitHomework(999, mockStudent.userId, 'student', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('throw BadRequestException khi student đã hết lượt làm bài', async () => {
      mockPrisma.homework.findUnique.mockResolvedValue(mockHomework);
      mockPrisma.student.findFirst.mockResolvedValue(mockStudent);
      mockPrisma.homeworkSubmission.count.mockResolvedValue(1); // đã nộp 1 lần (maxAttempts = 1)

      await expect(
        service.submitHomework(1, mockStudent.userId, 'student', {
          answers: {},
        } as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.submitHomework(1, mockStudent.userId, 'student', {
          answers: {},
        } as any),
      ).rejects.toThrow('Đã hết lượt làm bài.');
    });

    it('bài tự luận (essay) → grade = null, chờ giáo viên chấm', async () => {
      const essayHomework = { ...mockHomework, type: 'essay', questions: [] };
      mockPrisma.homework.findUnique.mockResolvedValue(essayHomework);
      mockPrisma.student.findFirst.mockResolvedValue(mockStudent);
      mockPrisma.homeworkSubmission.count.mockResolvedValue(0);
      mockPrisma.homeworkSubmission.findFirst.mockResolvedValue(null);
      mockPrisma.homeworkSubmission.create.mockResolvedValue({
        ...mockSubmission,
        grade: null,
      });

      const result = await service.submitHomework(
        1,
        mockStudent.userId,
        'student',
        {
          answers: { 1: 'Đây là câu trả lời của tôi' },
        },
      );

      expect(result.grade).toBeNull();
      expect(result.message).toBe(
        'Nộp bài thành công. Chờ giáo viên chấm điểm.',
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // gradeSubmission()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('gradeSubmission()', () => {
    const gradeDto = {
      submissionId: 10,
      grade: 8.5,
      feedback: 'Làm tốt!',
    };

    it('chấm điểm bài nộp thành công', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(mockTeacher);
      mockPrisma.homework.findUnique.mockResolvedValue(mockHomework);
      mockPrisma.homeworkSubmission.findUnique.mockResolvedValue(
        mockSubmission,
      );
      mockPrisma.homeworkSubmission.update.mockResolvedValue({
        ...mockSubmission,
        grade: 8.5,
        feedback: 'Làm tốt!',
      });

      const result = await service.gradeSubmission(
        1,
        mockTeacher.userId,
        gradeDto,
      );

      expect(result.message).toBe('Đã chấm điểm thành công');
      expect(result.submission.grade).toBe(8.5);
      expect(mockPrisma.homeworkSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: gradeDto.submissionId },
          data: expect.objectContaining({ grade: 8.5, feedback: 'Làm tốt!' }),
        }),
      );
    });

    it('throw ForbiddenException khi không phải teacher', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(null);

      await expect(
        service.gradeSubmission(1, 'invalid', gradeDto as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throw NotFoundException khi bài tập không tồn tại', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(mockTeacher);
      mockPrisma.homework.findUnique.mockResolvedValue(null);

      await expect(
        service.gradeSubmission(999, mockTeacher.userId, gradeDto as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('throw ForbiddenException khi teacher không phải chủ bài tập', async () => {
      const otherTeacher = { id: 'other-teacher', userId: 'other-user' };
      mockPrisma.teacher.findFirst.mockResolvedValue(otherTeacher);
      mockPrisma.homework.findUnique.mockResolvedValue(mockHomework);

      await expect(
        service.gradeSubmission(1, 'other-user', gradeDto as any),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.gradeSubmission(1, 'other-user', gradeDto as any),
      ).rejects.toThrow('Bạn không có quyền chấm bài tập này.');
    });

    it('throw NotFoundException khi submission không tồn tại', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(mockTeacher);
      mockPrisma.homework.findUnique.mockResolvedValue(mockHomework);
      mockPrisma.homeworkSubmission.findUnique.mockResolvedValue(null);

      await expect(
        service.gradeSubmission(1, mockTeacher.userId, {
          ...gradeDto,
          submissionId: 999,
        } as any),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.gradeSubmission(1, mockTeacher.userId, {
          ...gradeDto,
          submissionId: 999,
        } as any),
      ).rejects.toThrow('Không tìm thấy bài làm của học sinh.');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getSubmissionsCount()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('getSubmissionsCount()', () => {
    it('trả về số lần nộp và điểm tốt nhất khi được phép xem', async () => {
      mockPrisma.student.findFirst.mockResolvedValue(mockStudent);
      mockPrisma.homeworkSubmission.count.mockResolvedValue(2);
      // endTime trong quá khứ → isExpired = true → canViewScore = true
      const pastTime = new Date(Date.now() - 1000 * 60 * 60);
      mockPrisma.homework.findUnique.mockResolvedValue({
        studentViewPermission: 'NO_VIEW',
        gradingMethod: 'HIGHEST_ATTEMPT',
        endTime: pastTime,
      });
      mockPrisma.homeworkSubmission.findFirst.mockResolvedValue({
        id: 5,
        grade: 9.5,
      });

      const result = await service.getSubmissionsCount(1, mockStudent.userId);

      expect(result.count).toBe(2);
      expect(result.bestGrade).toBe(9.5);
      expect(result.bestSubmissionId).toBe(5);
    });

    it('ẩn điểm khi chưa hết hạn và studentViewPermission = NO_VIEW', async () => {
      mockPrisma.student.findFirst.mockResolvedValue(mockStudent);
      mockPrisma.homeworkSubmission.count.mockResolvedValue(1);
      // endTime trong tương lai → isExpired = false, NO_VIEW → canViewScore = false
      const futureTime = new Date(Date.now() + 1000 * 60 * 60 * 24);
      mockPrisma.homework.findUnique.mockResolvedValue({
        studentViewPermission: 'NO_VIEW',
        gradingMethod: 'HIGHEST_ATTEMPT',
        endTime: futureTime,
      });

      const result = await service.getSubmissionsCount(1, mockStudent.userId);

      expect(result.bestGrade).toBeNull();
      expect(result.bestSubmissionId).toBeNull();
    });

    it('throw ForbiddenException khi không phải student', async () => {
      mockPrisma.student.findFirst.mockResolvedValue(null);

      await expect(
        service.getSubmissionsCount(1, 'teacher-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throw NotFoundException khi bài tập không tồn tại', async () => {
      mockPrisma.student.findFirst.mockResolvedValue(mockStudent);
      mockPrisma.homeworkSubmission.count.mockResolvedValue(0);
      mockPrisma.homework.findUnique.mockResolvedValue(null);

      await expect(
        service.getSubmissionsCount(999, mockStudent.userId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
