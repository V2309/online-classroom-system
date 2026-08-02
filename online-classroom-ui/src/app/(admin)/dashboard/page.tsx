import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, Activity } from "lucide-react";
import { 
  getDashboardStats, 
  getUserGrowthData, 
  getClassActivityData, 
  getOnlineUsersCount 
} from "@/lib/actions/dashboard.action";
import UserGrowthChart from "@/components/dashboard/UserGrowthChart";
import ClassActivityChart from "@/components/dashboard/ClassActivityChart";

/**
 * Component cho một thẻ thống kê (Stat Card)
 */
interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
}

function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Trang Dashboard chính
 */
export default async function DashboardPage() {
  // Lấy dữ liệu từ server
  const [stats, userGrowthData, classActivityData, onlineStats] = await Promise.all([
    getDashboardStats(),
    getUserGrowthData(),
    getClassActivityData(),
    getOnlineUsersCount()
  ]);
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">

      {/* 1. Phần Thẻ Thống Kê */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Số lượng học sinh"
          value={stats.totalStudents.toLocaleString()}
          description={`+${stats.studentsGrowthPercent}% so với tháng trước`}
          icon={Users}
        />
        <StatCard
          title="Số lượng giáo viên"
          value={stats.totalTeachers.toLocaleString()}
          description={`+${stats.teachersGrowthPercent}% so với tháng trước`}
          icon={GraduationCap}
        />
        <StatCard
          title="Tổng lớp học"
          value={stats.totalClasses.toLocaleString()}
          description={`+${stats.classesGrowthPercent}% so với tháng trước`}
          icon={BookOpen}
        />
        <StatCard
          title="Bài tập hoàn thành"
          value={stats.completedHomeworkPercent + "%"}
          description="Tỷ lệ hoàn thành tuần này"
          icon={Activity}
        />
      </div>

      {/* 2. Phần Biểu Đồ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Biểu đồ Hoạt động Lớp học */}
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động lớp học (7 ngày gần đây)</CardTitle>
          </CardHeader>
          <CardContent>
            <ClassActivityChart data={classActivityData} />
          </CardContent>
        </Card>

        {/* Biểu đồ Tăng trưởng người dùng */}
        <Card>
          <CardHeader>
            <CardTitle>Tăng trưởng người dùng (6 tháng gần đây)</CardTitle>
          </CardHeader>
          <CardContent>
            <UserGrowthChart data={userGrowthData} />
          </CardContent>
        </Card>
      </div>

      {/* 3. Người dùng đang online */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-1">
        <OnlineUsersCard 
          totalOnline={onlineStats.onlineCount}
          yesterdayAccess={onlineStats.yesterdayAccess} 
          totalAccess={onlineStats.totalAccess}
        />
      </div> */}
    </div>
  );
}