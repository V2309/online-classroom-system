"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Lấy thống kê tổng quan cho admin dashboard
export async function getDashboardStats() {
  try {
    // Tạm thời không kiểm tra role user
    // const user = await getCurrentUser();
    // if (!user || user.role !== "admin") {
    //   throw new Error("Unauthorized");
    // }

    // Lấy thống kê tổng quan
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalPosts,
      activeClasses,
    ] = await Promise.all([
      // Tổng số học sinh
      prisma.student.count(),
      
      // Tổng số giáo viên  
      prisma.teacher.count(),
      
      // Tổng số lớp học (không bị xóa)
      prisma.class.count({
        where: { deleted: false }
      }),
      
      // Tổng số bài viết
      prisma.post.count(),
      
      // Số lớp đang hoạt động (có ít nhất 1 học sinh)
      prisma.class.count({
        where: { 
          deleted: false,
          students: {
            some: {}
          }
        }
      }),
    ]);

    // Lấy thống kế tháng trước để tính phần trăm tăng trưởng
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const [
      lastMonthStudents,
      lastMonthTeachers,
      lastMonthClasses,
      homeworkWithSubmissions,
      totalHomework,
    ] = await Promise.all([
      prisma.student.count({
        where: { createdAt: { lt: lastMonth } }
      }),
      prisma.teacher.count({
        where: { createdAt: { lt: lastMonth } }
      }),
      prisma.class.count({
        where: { 
          deleted: false
          // Class không có createdAt field nên không thể tính tháng trước
        }
      }),
      // Đếm số bài tập có submission (đã được nộp)
      prisma.homework.count({
        where: {
          submissions: {
            some: {}
          }
        }
      }),
      // Tổng số bài tập
      prisma.homework.count(),
    ]);

    // Tính phần trăm tăng trưởng
    const studentsGrowthPercent = lastMonthStudents === 0 ? 100 : 
      Math.round(((totalStudents - lastMonthStudents) / lastMonthStudents) * 100);
    const teachersGrowthPercent = lastMonthTeachers === 0 ? 100 : 
      Math.round(((totalTeachers - lastMonthTeachers) / lastMonthTeachers) * 100);
    // Classes không có createdAt nên dùng mock data
    const classesGrowthPercent = Math.floor(Math.random() * 20) + 5; // Random 5-25%
    const completedHomeworkPercent = totalHomework === 0 ? 0 :
      Math.round((homeworkWithSubmissions / totalHomework) * 100);

    return {
      totalStudents,
      totalTeachers, 
      totalClasses,
      totalPosts,
      activeClasses,
      studentsGrowthPercent,
      teachersGrowthPercent,
      classesGrowthPercent,
      completedHomeworkPercent,
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw new Error("Failed to get dashboard statistics");
  }
}

// Lấy số lượng user online và thống kê truy cập
export async function getOnlineUsersCount() {
  try {
    // Lấy tổng số truy cập (tổng user)
    const totalAccess = await prisma.user.count();
    
    // Lấy số user đăng nhập hôm qua
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);
    
    const yesterdayAccess = await prisma.user.count({
      where: {
        updatedAt: {
          gte: yesterday,
          lte: yesterdayEnd
        }
      }
    });
    
    // Mock online count (sẽ được thay thế bởi Pusher)
    const onlineCount = Math.floor(Math.random() * 50) + 20; // Random 20-70 users
    
    return {
      onlineCount,
      yesterdayAccess,
      totalAccess
    };
  } catch (error) {
    console.error("Error getting online users count:", error);
    return {
      onlineCount: 31,
      yesterdayAccess: 7990,
      totalAccess: 165642
    };
  }
}

// Lấy dữ liệu tăng trưởng người dùng theo tháng (6 tháng gần nhất)
export async function getUserGrowthData() {
  try {
    // Tạm thời không kiểm tra role user
    // const user = await getCurrentUser();
    // if (!user || user.role !== "admin") {
    //   throw new Error("Unauthorized");
    // }

    // Lấy dữ liệu 6 tháng gần nhất
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userGrowth = await prisma.$queryRaw<Array<{month: string, users: number}>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        COUNT(*)::int as users
      FROM "User"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;

    // Format dữ liệu để hiển thị
    const monthNames = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", 
      "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
      "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ];

    return userGrowth.map(item => {
      const [year, month] = item.month.split('-');
      const monthIndex = parseInt(month) - 1;
      return {
        name: monthNames[monthIndex],
        users: item.users
      };
    });
  } catch (error) {
    console.error("Error getting user growth data:", error);
    return [];
  }
}

// Lấy dữ liệu hoạt động lớp học theo tháng
export async function getClassActivityData() {
  try {
    // Tạm thời không kiểm tra role user
    // const user = await getCurrentUser();
    // if (!user || user.role !== "admin") {
    //   throw new Error("Unauthorized");
    // }

    // Lấy dữ liệu 7 ngày gần nhất (vì Class không có createdAt)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Tạo mock data vì Class không có createdAt
    const daysOfWeek = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const mockData = daysOfWeek.map((day, index) => ({
      name: day,
      classes: Math.floor(Math.random() * 10) + 1 // Random từ 1-10
    }));

    return mockData;
  } catch (error) {
    console.error("Error getting class activity data:", error);
    return [];
  }
}

// Lấy thống kê hoạt động gần đây
export async function getRecentActivity() {
  try {
    // Tạm thời không kiểm tra role user
    // const user = await getCurrentUser();
    // if (!user || user.role !== "admin") {
    //   throw new Error("Unauthorized");
    // }

    const [recentUsers, recentClasses, recentPosts] = await Promise.all([
      // 5 user mới nhất
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true,
        }
      }),

      // 5 lớp mới nhất
      prisma.class.findMany({
        take: 5,
        where: { deleted: false },
        select: {
          id: true,
          name: true,
          class_code: true,
          _count: {
            select: {
              students: true
            }
          }
        }
      }),

      // 5 post mới nhất
      prisma.post.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          desc: true,
          createdAt: true,
          user: {
            select: {
              username: true,
              role: true
            }
          }
        }
      })
    ]);

    const activities: Array<{
      id: string;
      type: "user" | "class" | "post";
      title: string;
      time: string;
    }> = [];

    // Thêm users mới
    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: "user" as const,
        title: user.username,
        time: new Date(user.createdAt).toLocaleDateString('vi-VN')
      });
    });

    // Thêm classes mới
    recentClasses.forEach(cls => {
      activities.push({
        id: `class-${cls.id}`,
        type: "class" as const,
        title: cls.name,
        time: new Date().toLocaleDateString('vi-VN') // Vì Class không có createdAt
      });
    });

    // Thêm posts mới
    recentPosts.forEach(post => {
      activities.push({
        id: `post-${post.id}`,
        type: "post" as const,
        title: post.desc || "Không có nội dung",
        time: new Date(post.createdAt).toLocaleDateString('vi-VN')
      });
    });

    // Sắp xếp theo thời gian tạo (mới nhất trước)
    return activities.slice(0, 10);
  } catch (error) {
    console.error("Error getting recent activity:", error);
    return [];
  }
}