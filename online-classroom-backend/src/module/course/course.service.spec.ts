import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../lib/database/prisma.service';
import { CourseService } from './course.service';

// ─── Mock data ───────────────────────────────────────────────────────────────

const mockTeacher = { id: 'teacher-id-1', userId: 'user-teacher-1' };
const mockStudent = { id: 'student-id-1', userId: 'user-student-1' };

const mockClass = {
  id: 1,
  class_code: 'CLS01',
  supervisorId: mockTeacher.id,
  deleted: false,
};

const mockCourse = {
  id: 'course-id-1',
  title: 'Toán Cơ Bản',
  description: 'Khóa học toán',
  thumbnailUrl: null,
  folderId: null,
  classCode: 'CLS01',
  createdBy: mockTeacher.id,
  isActive: true,
};

const mockFolder = {
  id: 'folder-id-1',
  name: 'Chương 1',
  description: null,
  color: '#3B82F6',
  classCode: 'CLS01',
  createdBy: mockTeacher.id,
  createdAt: new Date(),
};

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('CourseService', () => {
  let service: CourseService;

  const mockPrisma = {
    teacher: { findUnique: jest.fn() },
    student: { findUnique: jest.fn() },
    class: { findFirst: jest.fn() },
    course: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    folder: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    video: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CourseService>(CourseService);
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // [Pure Functions] extractYouTubeThumbnail & slugifyTitle
  // Được test gián tiếp qua createCourse() với dữ liệu YouTube URL
  // ─────────────────────────────────────────────────────────────────────────────

  describe('[Pure Functions] extractYouTubeThumbnail', () => {
    // Test thông qua createCourse — thumbnail tự động extract từ URL YouTube
    it('tự động extract thumbnail từ URL YouTube watch format', async () => {
      const videoId = 'dQw4w9WgXcQ';
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findFirst.mockResolvedValue(mockClass);
      mockPrisma.video.findUnique.mockResolvedValue(null); // slug chưa tồn tại

      const capturedCourseData: any[] = [];
      const capturedVideoData: any[] = [];

      mockPrisma.$transaction.mockImplementation((cb: any) => {
        const tx = {
          folder: { findFirst: jest.fn().mockResolvedValue(null) },
          course: {
            create: jest.fn().mockImplementation((args) => {
              capturedCourseData.push(args.data);
              return { ...mockCourse, id: 'new-course-id' };
            }),
            update: jest.fn().mockImplementation((args) => args.data),
          },
          chapter: { create: jest.fn().mockResolvedValue({ id: 'ch-1' }) },
          video: {
            create: jest.fn().mockImplementation((args) => {
              capturedVideoData.push(args.data);
              return { id: 'v-1' };
            }),
          },
        };
        return cb(tx);
      });

      await service.createCourse(mockTeacher.userId, {
        title: 'Test Course',
        classCode: 'CLS01',
        chapters: [
          {
            title: 'Chapter 1',
            videos: [
              {
                title: 'Video 1',
                url: `https://www.youtube.com/watch?v=${videoId}`,
              },
            ],
          },
        ],
      });

      expect(capturedVideoData[0].thumbnailUrl).toBe(
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      );
    });

    it('thumbnail = null khi URL không phải YouTube', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findFirst.mockResolvedValue(mockClass);
      mockPrisma.video.findUnique.mockResolvedValue(null);

      const capturedVideoData: any[] = [];

      mockPrisma.$transaction.mockImplementation((cb: any) => {
        const tx = {
          folder: { findFirst: jest.fn().mockResolvedValue(null) },
          course: {
            create: jest.fn().mockResolvedValue({ ...mockCourse, id: 'c-1' }),
            update: jest.fn(),
          },
          chapter: { create: jest.fn().mockResolvedValue({ id: 'ch-1' }) },
          video: {
            create: jest.fn().mockImplementation((args) => {
              capturedVideoData.push(args.data);
              return { id: 'v-1' };
            }),
          },
        };
        return cb(tx);
      });

      await service.createCourse(mockTeacher.userId, {
        title: 'Test',
        classCode: 'CLS01',
        chapters: [
          {
            title: 'Chapter 1',
            videos: [{ title: 'Video', url: 'https://example.com/video.mp4' }],
          },
        ],
      });

      expect(capturedVideoData[0].thumbnailUrl).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // createCourse()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('createCourse()', () => {
    const dto = {
      title: 'Toán Cơ Bản',
      classCode: 'CLS01',
      description: 'Mô tả',
      chapters: [],
    };

    it('tạo khóa học thành công', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findFirst.mockResolvedValue(mockClass);
      mockPrisma.$transaction.mockImplementation((cb: any) => {
        const tx = {
          folder: { findFirst: jest.fn().mockResolvedValue(null) },
          course: {
            create: jest.fn().mockResolvedValue(mockCourse),
            update: jest.fn(),
          },
          chapter: { create: jest.fn() },
          video: { create: jest.fn() },
        };
        return cb(tx);
      });

      const result = await service.createCourse(mockTeacher.userId, dto);

      expect(result).toEqual(mockCourse);
    });

    it('throw ForbiddenException khi userId không phải teacher', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(
        service.createCourse('student-user', dto as any),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.createCourse('student-user', dto as any),
      ).rejects.toThrow('Chỉ giáo viên mới có quyền thực hiện thao tác này.');
    });

    it('throw NotFoundException khi classCode không tồn tại', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findFirst.mockResolvedValue(null);

      await expect(
        service.createCourse(mockTeacher.userId, dto as any),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createCourse(mockTeacher.userId, dto as any),
      ).rejects.toThrow('Không tìm thấy lớp học.');
    });

    it('tạo folder mới nếu newFolderName được cung cấp và chưa tồn tại', async () => {
      const dtoWithNewFolder = {
        ...dto,
        newFolderName: 'Folder Mới',
        newFolderColor: '#FF5733',
      };
      const mockFolderCreate = jest
        .fn()
        .mockResolvedValue({ id: 'new-folder-id', name: 'Folder Mới' });

      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findFirst.mockResolvedValue(mockClass);
      mockPrisma.$transaction.mockImplementation((cb: any) => {
        const tx = {
          folder: {
            findFirst: jest.fn().mockResolvedValue(null), // chưa tồn tại
            create: mockFolderCreate,
          },
          course: {
            create: jest.fn().mockResolvedValue(mockCourse),
            update: jest.fn(),
          },
          chapter: { create: jest.fn() },
          video: { create: jest.fn() },
        };
        return cb(tx);
      });

      await service.createCourse(mockTeacher.userId, dtoWithNewFolder);

      expect(mockFolderCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Folder Mới' }),
        }),
      );
    });

    it('dùng folder đã tồn tại nếu newFolderName trùng với folder có sẵn', async () => {
      const dtoWithExistingFolderName = {
        ...dto,
        newFolderName: 'Chương 1',
      };

      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findFirst.mockResolvedValue(mockClass);

      const mockFolderCreate = jest.fn();
      mockPrisma.$transaction.mockImplementation((cb: any) => {
        const tx = {
          folder: {
            findFirst: jest.fn().mockResolvedValue(mockFolder), // đã tồn tại
            create: mockFolderCreate,
          },
          course: {
            create: jest.fn().mockResolvedValue(mockCourse),
            update: jest.fn(),
          },
          chapter: { create: jest.fn() },
          video: { create: jest.fn() },
        };
        return cb(tx);
      });

      await service.createCourse(mockTeacher.userId, dtoWithExistingFolderName);

      // Không tạo folder mới
      expect(mockFolderCreate).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getCourseById()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('getCourseById()', () => {
    it('trả về chi tiết khóa học (teacher role)', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findFirst.mockResolvedValue(mockClass);
      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);

      const result = await service.getCourseById(
        'course-id-1',
        'CLS01',
        mockTeacher.userId,
        'teacher',
      );

      expect(result).toEqual(mockCourse);
    });

    it('trả về chi tiết khóa học (student role)', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.class.findFirst.mockResolvedValue(mockClass);
      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);

      const result = await service.getCourseById(
        'course-id-1',
        'CLS01',
        mockStudent.userId,
        'student',
      );

      expect(result).toEqual(mockCourse);
    });

    it('throw NotFoundException khi khóa học không tồn tại', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findFirst.mockResolvedValue(mockClass);
      mockPrisma.course.findFirst.mockResolvedValue(null);

      await expect(
        service.getCourseById(
          'nonexistent',
          'CLS01',
          mockTeacher.userId,
          'teacher',
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getCourseById(
          'nonexistent',
          'CLS01',
          mockTeacher.userId,
          'teacher',
        ),
      ).rejects.toThrow('Không tìm thấy khóa học.');
    });

    it('throw NotFoundException khi student chưa tham gia lớp', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.class.findFirst.mockResolvedValue(null); // student không trong lớp

      await expect(
        service.getCourseById(
          'course-id-1',
          'CLS01',
          mockStudent.userId,
          'student',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // updateCourse()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('updateCourse()', () => {
    const updateDto = { title: 'Toán Nâng Cao' };

    it('cập nhật khóa học thành công', async () => {
      const updatedCourse = { ...mockCourse, title: 'Toán Nâng Cao' };
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.$transaction.mockImplementation((cb: any) => {
        const tx = {
          folder: { findFirst: jest.fn().mockResolvedValue(null) },
          course: { update: jest.fn().mockResolvedValue(updatedCourse) },
          chapter: { create: jest.fn() },
          video: { create: jest.fn(), deleteMany: jest.fn() },
        };
        return cb(tx);
      });

      const result = await service.updateCourse(
        'course-id-1',
        mockTeacher.userId,
        updateDto,
      );

      expect(result.title).toBe('Toán Nâng Cao');
    });

    it('throw ForbiddenException khi không phải teacher', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCourse('course-id-1', 'student-user', updateDto as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throw NotFoundException khi khóa học không tồn tại', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.course.findFirst.mockResolvedValue(null);

      await expect(
        service.updateCourse(
          'nonexistent',
          mockTeacher.userId,
          updateDto as any,
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateCourse(
          'nonexistent',
          mockTeacher.userId,
          updateDto as any,
        ),
      ).rejects.toThrow('Không tìm thấy khóa học.');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // deleteCourse()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('deleteCourse()', () => {
    it('xóa khóa học thành công', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.course.delete.mockResolvedValue(mockCourse);

      const result = await service.deleteCourse(
        'course-id-1',
        mockTeacher.userId,
      );

      expect(result.message).toBe('Đã xóa khóa học thành công.');
      expect(mockPrisma.course.delete).toHaveBeenCalledWith({
        where: { id: 'course-id-1' },
      });
    });

    it('throw ForbiddenException khi không phải teacher', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteCourse('course-id-1', 'invalid'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throw NotFoundException khi khóa học không tồn tại', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.course.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteCourse('nonexistent', mockTeacher.userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // moveCourseToFolder()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('moveCourseToFolder()', () => {
    it('di chuyển khóa học vào folder thành công', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.course.update.mockResolvedValue({
        ...mockCourse,
        folderId: 'folder-id-1',
      });

      const result = await service.moveCourseToFolder(
        'course-id-1',
        mockTeacher.userId,
        { newFolderId: 'folder-id-1', classCode: 'CLS01' },
      );

      expect(result.message).toBe('Đã di chuyển khóa học thành công.');
      expect(mockPrisma.course.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { folderId: 'folder-id-1' } }),
      );
    });

    it('di chuyển ra ngoài folder (unassigned) → folderId = null', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.course.update.mockResolvedValue({
        ...mockCourse,
        folderId: null,
      });

      await service.moveCourseToFolder('course-id-1', mockTeacher.userId, {
        newFolderId: 'unassigned',
        classCode: 'CLS01',
      });

      expect(mockPrisma.course.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { folderId: null } }),
      );
    });

    it('throw ForbiddenException khi không phải teacher', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(
        service.moveCourseToFolder('course-id-1', 'invalid', {
          newFolderId: 'f-1',
          classCode: 'CLS01',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throw NotFoundException khi khóa học không tồn tại', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.course.findFirst.mockResolvedValue(null);

      await expect(
        service.moveCourseToFolder('nonexistent', mockTeacher.userId, {
          newFolderId: 'f-1',
          classCode: 'CLS01',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // createFolder()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('createFolder()', () => {
    const folderDto = {
      name: 'Chương 1',
      classCode: 'CLS01',
      color: '#FF0000',
    };

    it('tạo folder thành công', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findFirst.mockResolvedValue(mockClass);
      mockPrisma.folder.create.mockResolvedValue(mockFolder);

      const result = await service.createFolder(mockTeacher.userId, folderDto);

      expect(result).toEqual(mockFolder);
      expect(mockPrisma.folder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Chương 1',
            classCode: 'CLS01',
            createdBy: mockTeacher.id,
          }),
        }),
      );
    });

    it('throw ForbiddenException khi không phải teacher', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(
        service.createFolder('invalid', folderDto as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throw NotFoundException khi classCode không tồn tại', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findFirst.mockResolvedValue(null);

      await expect(
        service.createFolder(mockTeacher.userId, folderDto as any),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createFolder(mockTeacher.userId, folderDto as any),
      ).rejects.toThrow('Không tìm thấy lớp học.');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // updateFolder()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('updateFolder()', () => {
    const updateDto = { name: 'Chương 2 Updated' };

    it('cập nhật tên folder thành công', async () => {
      const updatedFolder = { ...mockFolder, name: 'Chương 2 Updated' };
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.folder.findFirst.mockResolvedValue(mockFolder);
      mockPrisma.folder.update.mockResolvedValue(updatedFolder);

      const result = await service.updateFolder(
        'folder-id-1',
        mockTeacher.userId,
        updateDto,
      );

      expect(result.name).toBe('Chương 2 Updated');
      expect(mockPrisma.folder.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'folder-id-1' } }),
      );
    });

    it('throw ForbiddenException khi không phải teacher', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(
        service.updateFolder('folder-id-1', 'invalid', updateDto as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throw NotFoundException khi folder không tồn tại', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.folder.findFirst.mockResolvedValue(null);

      await expect(
        service.updateFolder(
          'nonexistent',
          mockTeacher.userId,
          updateDto as any,
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateFolder(
          'nonexistent',
          mockTeacher.userId,
          updateDto as any,
        ),
      ).rejects.toThrow('Không tìm thấy thư mục.');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // deleteFolder()
  // ─────────────────────────────────────────────────────────────────────────────

  describe('deleteFolder()', () => {
    it('xóa folder và chuyển courses về null folderId', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.folder.findFirst.mockResolvedValue(mockFolder);

      const mockCourseUpdateMany = jest.fn().mockResolvedValue({ count: 2 });
      const mockFolderDelete = jest.fn().mockResolvedValue({});

      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        await cb({
          course: { updateMany: mockCourseUpdateMany },
          folder: { delete: mockFolderDelete },
        });
      });

      const result = await service.deleteFolder(
        'folder-id-1',
        mockTeacher.userId,
      );

      expect(result.message).toContain('Chương 1');
      expect(result.message).toContain('Tất cả');
      expect(mockCourseUpdateMany).toHaveBeenCalledWith({
        where: { folderId: 'folder-id-1' },
        data: { folderId: null },
      });
      expect(mockFolderDelete).toHaveBeenCalledWith({
        where: { id: 'folder-id-1' },
      });
    });

    it('throw ForbiddenException khi không phải teacher', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteFolder('folder-id-1', 'invalid'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throw NotFoundException khi folder không tồn tại', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.folder.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteFolder('nonexistent', mockTeacher.userId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.deleteFolder('nonexistent', mockTeacher.userId),
      ).rejects.toThrow('Không tìm thấy thư mục.');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getClassFolders() — quyền truy cập theo role
  // ─────────────────────────────────────────────────────────────────────────────

  describe('getClassFolders()', () => {
    it('teacher lấy danh sách folder thành công', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      mockPrisma.class.findFirst.mockResolvedValue(mockClass);
      mockPrisma.folder.findMany.mockResolvedValue([mockFolder]);

      const result = await service.getClassFolders(
        'CLS01',
        mockTeacher.userId,
        'teacher',
      );

      expect(result).toEqual([mockFolder]);
      expect(mockPrisma.folder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { classCode: 'CLS01' } }),
      );
    });

    it('student lấy folder của lớp đã tham gia', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.class.findFirst.mockResolvedValue(mockClass);
      mockPrisma.folder.findMany.mockResolvedValue([mockFolder]);

      const result = await service.getClassFolders(
        'CLS01',
        mockStudent.userId,
        'student',
      );

      expect(result).toEqual([mockFolder]);
    });

    it('throw NotFoundException khi teacher không tìm thấy giáo viên', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(
        service.getClassFolders('CLS01', 'invalid', 'teacher'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throw NotFoundException khi student chưa tham gia lớp', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.class.findFirst.mockResolvedValue(null); // không trong lớp

      await expect(
        service.getClassFolders('CLS01', mockStudent.userId, 'student'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
