import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../lib/database/prisma.service';
import { ClassService } from './class.service';

// ─── Mock data ───────────────────────────────────────────────────────────────

const mockTeacher = { id: 'teacher-id-1', userId: 'user-teacher-1' };
const mockStudent = { id: 'student-id-1', userId: 'user-student-1' };

const mockClass = {
  id: 1,
  name: 'Toán 10A1',
  class_code: 'ABC12',
  capacity: 40,
  gradeId: 'grade-1',
  supervisorId: mockTeacher.id,
  deleted: false,
  deletedAt: null,
  blockLeave: false,
  isProtected: false,
  isLocked: false,
  requiresApproval: false,
  _count: { students: 5 },
};

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('ClassService', () => {
  let service: ClassService;

  const mockPrisma = {
    teacher: { findUnique: jest.fn() },
    student: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    grade: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    class: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    classJoinRequest: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ClassService>(ClassService);
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // createClass()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('createClass()', () => {
    const dto = { name: 'Toán 10A1', capacity: 40, gradeId: 'grade-1', img: null };

    it('tạo lớp thành công khi teacher tồn tại', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      // class_code unique check: lần đầu null → không trùng
      mockPrisma.class.findUnique.mockResolvedValue(null);
      mockPrisma.class.create.mockResolvedValue(mockClass);

      const result = await service.createClass(mockTeacher.userId, dto);

      expect(result).toEqual(mockClass);
      expect(mockPrisma.class.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: dto.name,
            supervisorId: mockTeacher.id,
          }),
        }),
      );
    });

    it('throw NotFoundException khi userId không phải teacher', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(service.createClass('invalid-user', dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createClass('invalid-user', dto)).rejects.toThrow(
        'Không tìm thấy thông tin giáo viên.',
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getClassByCode()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('getClassByCode()', () => {
    it('trả về thông tin lớp khi tìm thấy', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(mockClass);

      const result = await service.getClassByCode('ABC12');

      expect(result).toEqual(mockClass);
      expect(mockPrisma.class.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { class_code: 'ABC12', deleted: false } }),
      );
    });

    it('throw NotFoundException khi không tìm thấy lớp', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(null);

      await expect(service.getClassByCode('XXXXX')).rejects.toThrow(NotFoundException);
      await expect(service.getClassByCode('XXXXX')).rejects.toThrow(
        'Lớp học không tồn tại.',
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // updateClass()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('updateClass()', () => {
    const dto = { name: 'Toán 10A1 Updated' };

    it('cập nhật lớp thành công khi teacher là chủ lớp', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findUnique.mockResolvedValue(mockClass);
      mockPrisma.class.update.mockResolvedValue({ ...mockClass, name: 'Toán 10A1 Updated' });

      const result = await service.updateClass(1, mockTeacher.userId, dto);

      expect(result.name).toBe('Toán 10A1 Updated');
    });

    it('throw ForbiddenException khi userId không phải teacher', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(service.updateClass(1, 'student-user', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throw NotFoundException khi lớp không tồn tại', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findUnique.mockResolvedValue(null);

      await expect(service.updateClass(999, mockTeacher.userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throw ForbiddenException khi teacher không phải chủ lớp', async () => {
      const otherTeacher = { id: 'other-teacher', userId: 'other-user' };
      mockPrisma.teacher.findUnique.mockResolvedValue(otherTeacher);
      mockPrisma.class.findUnique.mockResolvedValue(mockClass); // supervisorId = mockTeacher.id

      await expect(service.updateClass(1, 'other-user', dto)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.updateClass(1, 'other-user', dto)).rejects.toThrow(
        'Bạn không có quyền sửa lớp này.',
      );
    });

    it('throw NotFoundException khi lớp đã bị xóa (deleted = true)', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findUnique.mockResolvedValue({ ...mockClass, deleted: true });

      await expect(service.updateClass(1, mockTeacher.userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // deleteClass()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('deleteClass()', () => {
    it('soft delete lớp thành công (deleted = true)', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findUnique.mockResolvedValue(mockClass);
      mockPrisma.class.update.mockResolvedValue({ ...mockClass, deleted: true });

      const result = await service.deleteClass(1, mockTeacher.userId);

      expect(mockPrisma.class.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ deleted: true }),
        }),
      );
      expect(result.deleted).toBe(true);
    });

    it('throw ForbiddenException khi không phải teacher', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(service.deleteClass(1, 'invalid')).rejects.toThrow(ForbiddenException);
    });

    it('throw ForbiddenException khi teacher không phải chủ lớp', async () => {
      const otherTeacher = { id: 'other-id', userId: 'other-user' };
      mockPrisma.teacher.findUnique.mockResolvedValue(otherTeacher);
      mockPrisma.class.findUnique.mockResolvedValue(mockClass);

      await expect(service.deleteClass(1, 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.deleteClass(1, 'other-user')).rejects.toThrow(
        'Bạn không có quyền xóa lớp này.',
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // restoreClass()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('restoreClass()', () => {
    it('khôi phục lớp đã xóa thành công', async () => {
      const deletedClass = { ...mockClass, deleted: true };
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findUnique.mockResolvedValue(deletedClass);
      mockPrisma.class.update.mockResolvedValue({ ...deletedClass, deleted: false });

      const result = await service.restoreClass(1, mockTeacher.userId);

      expect(mockPrisma.class.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { deleted: false, deletedAt: null },
        }),
      );
      expect(result.deleted).toBe(false);
    });

    it('throw ForbiddenException khi không phải teacher', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(service.restoreClass(1, 'invalid')).rejects.toThrow(ForbiddenException);
    });

    it('throw NotFoundException khi lớp không tồn tại', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findUnique.mockResolvedValue(null);

      await expect(service.restoreClass(999, mockTeacher.userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throw ForbiddenException khi teacher không phải chủ lớp', async () => {
      const otherTeacher = { id: 'other-id', userId: 'other-user' };
      mockPrisma.teacher.findUnique.mockResolvedValue(otherTeacher);
      mockPrisma.class.findUnique.mockResolvedValue(mockClass);

      await expect(service.restoreClass(1, 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // joinClass()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('joinClass()', () => {
    it('student gửi yêu cầu vào lớp thành công', async () => {
      const classWithSpace = { ...mockClass, _count: { students: 5 } }; // còn chỗ
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.class.findUnique.mockResolvedValue(classWithSpace);
      mockPrisma.class.findFirst.mockResolvedValue(null); // chưa là thành viên
      mockPrisma.classJoinRequest.findFirst.mockResolvedValue(null); // không có PENDING
      mockPrisma.classJoinRequest.create.mockResolvedValue({
        id: 1,
        classCode: 'ABC12',
        studentId: mockStudent.id,
        status: 'PENDING',
      });

      const result = await service.joinClass('ABC12', mockStudent.userId);

      expect(result.status).toBe('PENDING');
      expect(mockPrisma.classJoinRequest.create).toHaveBeenCalled();
    });

    it('throw NotFoundException khi student không tồn tại', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null);

      await expect(service.joinClass('ABC12', 'invalid')).rejects.toThrow(NotFoundException);
    });

    it('throw NotFoundException khi mã lớp không hợp lệ', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.class.findUnique.mockResolvedValue(null);

      await expect(service.joinClass('XXXXX', mockStudent.userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.joinClass('XXXXX', mockStudent.userId)).rejects.toThrow(
        'Mã lớp không hợp lệ hoặc lớp không tồn tại.',
      );
    });

    it('throw ConflictException khi student đã là thành viên', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.class.findUnique.mockResolvedValue(mockClass);
      mockPrisma.class.findFirst.mockResolvedValue(mockClass); // đã là thành viên

      await expect(service.joinClass('ABC12', mockStudent.userId)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.joinClass('ABC12', mockStudent.userId)).rejects.toThrow(
        'Bạn đã là thành viên của lớp này.',
      );
    });

    it('throw BadRequestException khi lớp đã đầy', async () => {
      const fullClass = { ...mockClass, capacity: 5, _count: { students: 5 } };
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.class.findUnique.mockResolvedValue(fullClass);
      mockPrisma.class.findFirst.mockResolvedValue(null); // chưa là thành viên

      await expect(service.joinClass('ABC12', mockStudent.userId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.joinClass('ABC12', mockStudent.userId)).rejects.toThrow(
        'Lớp học đã đầy.',
      );
    });

    it('throw ConflictException khi đã có PENDING request', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.class.findUnique.mockResolvedValue(mockClass);
      mockPrisma.class.findFirst.mockResolvedValue(null);
      mockPrisma.classJoinRequest.findFirst.mockResolvedValue({ id: 1, status: 'PENDING' });

      await expect(service.joinClass('ABC12', mockStudent.userId)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.joinClass('ABC12', mockStudent.userId)).rejects.toThrow(
        'Bạn đã gửi yêu cầu, đang chờ giáo viên duyệt.',
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // leaveClass()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('leaveClass()', () => {
    it('student rời lớp thành công', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.class.findUnique.mockResolvedValue(mockClass);
      mockPrisma.class.findFirst.mockResolvedValue(mockClass); // là thành viên
      mockPrisma.class.update.mockResolvedValue({});

      const result = await service.leaveClass(1, mockStudent.userId);

      expect(result.message).toBe('Rời lớp thành công.');
      expect(mockPrisma.class.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { students: { disconnect: { id: mockStudent.id } } },
        }),
      );
    });

    it('throw NotFoundException khi student không tồn tại', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null);

      await expect(service.leaveClass(1, 'invalid')).rejects.toThrow(NotFoundException);
    });

    it('throw NotFoundException khi lớp không tồn tại', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.class.findUnique.mockResolvedValue(null);

      await expect(service.leaveClass(999, mockStudent.userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throw ForbiddenException khi lớp đã khóa tính năng rời lớp', async () => {
      const lockedClass = { ...mockClass, blockLeave: true };
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.class.findUnique.mockResolvedValue(lockedClass);

      await expect(service.leaveClass(1, mockStudent.userId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.leaveClass(1, mockStudent.userId)).rejects.toThrow(
        'Giáo viên đã khóa tính năng rời lớp.',
      );
    });

    it('throw BadRequestException khi student không phải thành viên', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.class.findUnique.mockResolvedValue(mockClass);
      mockPrisma.class.findFirst.mockResolvedValue(null); // không phải thành viên

      await expect(service.leaveClass(1, mockStudent.userId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.leaveClass(1, mockStudent.userId)).rejects.toThrow(
        'Bạn không phải thành viên của lớp này.',
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // approveJoinRequest()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('approveJoinRequest()', () => {
    const mockRequest = {
      id: 1,
      classCode: 'ABC12',
      studentId: mockStudent.id,
      status: 'PENDING',
      class: { ...mockClass },
    };

    it('teacher duyệt yêu cầu thành công', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.classJoinRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrisma.class.findUnique.mockResolvedValue({
        ...mockClass,
        _count: { students: 5 }, // chưa đầy
      });
      mockPrisma.$transaction.mockResolvedValue([
        { ...mockRequest, status: 'APPROVED' },
        mockClass,
      ]);

      const result = await service.approveJoinRequest(1, mockTeacher.userId);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('throw ForbiddenException khi không phải teacher', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(service.approveJoinRequest(1, 'invalid')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throw NotFoundException khi request không tồn tại', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.classJoinRequest.findUnique.mockResolvedValue(null);

      await expect(service.approveJoinRequest(999, mockTeacher.userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throw NotFoundException khi request không phải PENDING', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.classJoinRequest.findUnique.mockResolvedValue({
        ...mockRequest,
        status: 'APPROVED',
      });

      await expect(service.approveJoinRequest(1, mockTeacher.userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.approveJoinRequest(1, mockTeacher.userId)).rejects.toThrow(
        'Yêu cầu không tồn tại hoặc đã xử lý.',
      );
    });

    it('throw ForbiddenException khi teacher không phải chủ lớp trong request', async () => {
      const otherTeacher = { id: 'other-teacher', userId: 'other-user' };
      mockPrisma.teacher.findUnique.mockResolvedValue(otherTeacher);
      mockPrisma.classJoinRequest.findUnique.mockResolvedValue(mockRequest);

      await expect(service.approveJoinRequest(1, 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throw BadRequestException khi lớp đã đầy', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.classJoinRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrisma.class.findUnique.mockResolvedValue({
        ...mockClass,
        capacity: 5,
        _count: { students: 5 }, // đầy
      });

      await expect(service.approveJoinRequest(1, mockTeacher.userId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.approveJoinRequest(1, mockTeacher.userId)).rejects.toThrow(
        'Lớp đã đầy, không thể thêm học sinh.',
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // rejectJoinRequest()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('rejectJoinRequest()', () => {
    const mockRequest = {
      id: 1,
      classCode: 'ABC12',
      studentId: mockStudent.id,
      status: 'PENDING',
      class: { ...mockClass },
    };

    it('teacher từ chối yêu cầu thành công', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.classJoinRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrisma.classJoinRequest.update.mockResolvedValue({
        ...mockRequest,
        status: 'REJECTED',
      });

      const result = await service.rejectJoinRequest(1, mockTeacher.userId);

      expect(mockPrisma.classJoinRequest.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'REJECTED' },
      });
    });

    it('throw ForbiddenException khi không phải teacher', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(service.rejectJoinRequest(1, 'invalid')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throw NotFoundException khi request đã xử lý rồi', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.classJoinRequest.findUnique.mockResolvedValue({
        ...mockRequest,
        status: 'REJECTED',
      });

      await expect(service.rejectJoinRequest(1, mockTeacher.userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // removeStudentFromClass()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('removeStudentFromClass()', () => {
    it('teacher xóa student khỏi lớp thành công', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findUnique.mockResolvedValue(mockClass);
      mockPrisma.class.update.mockResolvedValue({});

      const result = await service.removeStudentFromClass(
        'ABC12',
        mockStudent.id,
        mockTeacher.userId,
      );

      expect(result.message).toBe('Đã xóa học sinh khỏi lớp học thành công.');
      expect(mockPrisma.class.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { students: { disconnect: { id: mockStudent.id } } },
        }),
      );
    });

    it('throw ForbiddenException khi không phải teacher', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(
        service.removeStudentFromClass('ABC12', mockStudent.id, 'invalid'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throw NotFoundException khi lớp không tồn tại', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findUnique.mockResolvedValue(null);

      await expect(
        service.removeStudentFromClass('XXXXX', mockStudent.id, mockTeacher.userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throw ForbiddenException khi teacher không phải chủ lớp', async () => {
      const otherTeacher = { id: 'other-teacher', userId: 'other-user' };
      mockPrisma.teacher.findUnique.mockResolvedValue(otherTeacher);
      mockPrisma.class.findUnique.mockResolvedValue(mockClass);

      await expect(
        service.removeStudentFromClass('ABC12', mockStudent.id, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.removeStudentFromClass('ABC12', mockStudent.id, 'other-user'),
      ).rejects.toThrow('Bạn không có quyền quản lý lớp này.');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getDeletedClasses()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('getDeletedClasses()', () => {
    it('trả về danh sách lớp đã xóa của teacher', async () => {
      const deletedClasses = [{ ...mockClass, deleted: true }];
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findMany.mockResolvedValue(deletedClasses);

      const result = await service.getDeletedClasses(mockTeacher.userId);

      expect(result).toEqual(deletedClasses);
      expect(mockPrisma.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { supervisorId: mockTeacher.id, deleted: true },
        }),
      );
    });

    it('throw ForbiddenException khi không phải teacher', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(service.getDeletedClasses('invalid')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getGrades()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('getGrades()', () => {
    it('trả về danh sách khối lớp', async () => {
      const grades = [{ id: 'g1', level: '10' }, { id: 'g2', level: '11' }];
      mockPrisma.grade.findMany.mockResolvedValue(grades);

      const result = await service.getGrades();

      expect(result).toEqual(grades);
      expect(mockPrisma.grade.findMany).toHaveBeenCalled();
    });
  });
});
