'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Types
type CreateGroupData = {
  name: string;
  classCode: string;
  color?: string;
  maxSize?: number | null;
};

type UpdateGroupMembersData = {
  studentId: string;
  targetGroupId: string | null; // null means move to unassigned
  classCode: string;
};

// Tạo nhóm mới
export async function createGroup(data: CreateGroupData) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher') {
      return { success: false, error: 'Unauthorized' };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id as string },
    });
    if (!teacher) {
      return { success: false, error: 'Teacher not found' };
    }

    // Kiểm tra quyền truy cập lớp
    const classInfo = await prisma.class.findFirst({
      where: {
        class_code: data.classCode,
        supervisorId: teacher.id,
        deleted: false,
      },
    });

    if (!classInfo) {
      return { success: false, error: 'Không có quyền truy cập lớp học' };
    }

    // Tạo nhóm mới
    const group = await prisma.classGroup.create({
      data: {
        name: data.name,
        classCode: data.classCode,
        color: data.color,
        maxSize: data.maxSize,
        createdById: teacher.id,
      },
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                username: true,
                img: true,
                class_name: true,
              },
            },
          },
        },
      },
    });

    revalidatePath(`/class/${data.classCode}/groups`);
    
    return { success: true, group };
  } catch (error) {
    console.error('Error creating group:', error);
    return { success: false, error: 'Có lỗi xảy ra khi tạo nhóm' };
  }
}

// Cập nhật thành viên nhóm (drag and drop)
export async function updateGroupMembers(data: UpdateGroupMembersData) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher') {
      return { success: false, error: 'Unauthorized' };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id as string },
    });
    if (!teacher) {
      return { success: false, error: 'Teacher not found' };
    }

    // Kiểm tra quyền truy cập lớp
    const classInfo = await prisma.class.findFirst({
      where: {
        class_code: data.classCode,
        supervisorId: teacher.id,
        deleted: false,
      },
    });

    if (!classInfo) {
      return { success: false, error: 'Không có quyền truy cập lớp học' };
    }

    // Kiểm tra học sinh có trong lớp không
    const studentInClass = await prisma.student.findFirst({
      where: {
        id: data.studentId,
        classes: {
          some: {
            class_code: data.classCode,
          },
        },
      },
    });

    if (!studentInClass) {
      return { success: false, error: 'Học sinh không thuộc lớp học này' };
    }

    // Sử dụng transaction để đảm bảo tính nhất quán
    await prisma.$transaction(async (tx) => {
      // 1. Xóa học sinh khỏi nhóm hiện tại (nếu có)
      await tx.classGroupMember.deleteMany({
        where: {
          studentId: data.studentId,
          group: {
            classCode: data.classCode,
          },
        },
      });

      // 2. Nếu targetGroupId không null, thêm vào nhóm mới
      if (data.targetGroupId) {
        // Kiểm tra nhóm target có tồn tại và thuộc lớp học này không
        const targetGroup = await tx.classGroup.findFirst({
          where: {
            id: data.targetGroupId,
            classCode: data.classCode,
          },
          include: {
            members: true,
          },
        });

        if (!targetGroup) {
          throw new Error('Nhóm không tồn tại');
        }

        // Kiểm tra giới hạn thành viên
        if (targetGroup.maxSize && targetGroup.members.length >= targetGroup.maxSize) {
          throw new Error(`Nhóm đã đầy (tối đa ${targetGroup.maxSize} thành viên)`);
        }

        // Thêm vào nhóm mới
        await tx.classGroupMember.create({
          data: {
            groupId: data.targetGroupId,
            studentId: data.studentId,
            role: 'MEMBER',
          },
        });
      }
    });

    revalidatePath(`/class/${data.classCode}/groups`);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating group members:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật nhóm' 
    };
  }
}

// Xóa nhóm
export async function deleteGroup(groupId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher') {
      return { success: false, error: 'Unauthorized' };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id as string },
    });
    if (!teacher) {
      return { success: false, error: 'Teacher not found' };
    }

    // Kiểm tra nhóm có tồn tại và do giáo viên này tạo không
    const group = await prisma.classGroup.findFirst({
      where: {
        id: groupId,
        createdById: teacher.id,
      },
      include: {
        class: true,
      },
    });

    if (!group) {
      return { success: false, error: 'Không tìm thấy nhóm hoặc không có quyền xóa' };
    }

    // Xóa nhóm (cascade sẽ tự động xóa các thành viên)
    await prisma.classGroup.delete({
      where: {
        id: groupId,
      },
    });

    revalidatePath(`/class/${group.classCode}/groups`);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting group:', error);
    return { success: false, error: 'Có lỗi xảy ra khi xóa nhóm' };
  }
}

// Lấy thông tin nhóm của một lớp
export async function getClassGroups(classCode: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    let teacherId = null;
    let studentId = null;

    if (user.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id as string },
      });
      teacherId = teacher?.id;
    } else if (user.role === 'student') {
      const student = await prisma.student.findUnique({
        where: { userId: user.id as string },
      });
      studentId = student?.id;
    }

    // Kiểm tra quyền truy cập lớp
    const whereConditions = [];
    
    if (teacherId) {
      whereConditions.push({ supervisorId: teacherId });
    }
    
    if (studentId) {
      whereConditions.push({ students: { some: { id: studentId } } });
    }
    
    if (whereConditions.length === 0) {
      return { success: false, error: 'Unauthorized' };
    }

    const classInfo = await prisma.class.findFirst({
      where: {
        class_code: classCode,
        deleted: false,
        OR: whereConditions,
      },
    });

    if (!classInfo) {
      return { success: false, error: 'Không có quyền truy cập lớp học' };
    }

    // Lấy danh sách nhóm
    const groups = await prisma.classGroup.findMany({
      where: {
        classCode: classCode,
      },
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                username: true,
                img: true,
                class_name: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return { success: true, groups };
  } catch (error) {
    console.error('Error getting class groups:', error);
    return { success: false, error: 'Có lỗi xảy ra khi lấy danh sách nhóm' };
  }
}

// Cập nhật thông tin nhóm
export async function updateGroup(groupId: string, data: { name?: string; color?: string; maxSize?: number | null }) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher') {
      return { success: false, error: 'Unauthorized' };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id as string },
    });
    if (!teacher) {
      return { success: false, error: 'Teacher not found' };
    }

    // Kiểm tra nhóm có tồn tại và do giáo viên này tạo không
    const group = await prisma.classGroup.findFirst({
      where: {
        id: groupId,
        createdById: teacher.id,
      },
    });

    if (!group) {
      return { success: false, error: 'Không tìm thấy nhóm hoặc không có quyền chỉnh sửa' };
    }

    // Cập nhật nhóm
    const updatedGroup = await prisma.classGroup.update({
      where: {
        id: groupId,
      },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.color && { color: data.color }),
        ...(data.maxSize !== undefined && { maxSize: data.maxSize }),
      },
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                username: true,
                img: true,
                class_name: true,
              },
            },
          },
        },
      },
    });

    revalidatePath(`/class/${group.classCode}/groups`);
    
    return { success: true, group: updatedGroup };
  } catch (error) {
    console.error('Error updating group:', error);
    return { success: false, error: 'Có lỗi xảy ra khi cập nhật nhóm' };
  }
}

// Thiết lập trưởng nhóm
export async function setGroupLeader(groupId: string, studentId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher') {
      return { success: false, error: 'Unauthorized' };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id as string },
    });
    if (!teacher) {
      return { success: false, error: 'Teacher not found' };
    }

    // Kiểm tra nhóm có tồn tại và do giáo viên này tạo không
    const group = await prisma.classGroup.findFirst({
      where: {
        id: groupId,
        createdById: teacher.id,
      },
    });

    if (!group) {
      return { success: false, error: 'Không tìm thấy nhóm hoặc không có quyền chỉnh sửa' };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Đặt tất cả thành viên trong nhóm thành MEMBER
      await tx.classGroupMember.updateMany({
        where: {
          groupId: groupId,
        },
        data: {
          role: 'MEMBER',
        },
      });

      // 2. Đặt học sinh được chọn làm LEADER
      await tx.classGroupMember.updateMany({
        where: {
          groupId: groupId,
          studentId: studentId,
        },
        data: {
          role: 'LEADER',
        },
      });
    });

    revalidatePath(`/class/${group.classCode}/groups`);
    
    return { success: true };
  } catch (error) {
    console.error('Error setting group leader:', error);
    return { success: false, error: 'Có lỗi xảy ra khi thiết lập trưởng nhóm' };
  }
}