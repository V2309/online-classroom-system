import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, Activity } from "lucide-react";
import UserGrowthChart from "@/components/dashboard/UserGrowthChart";
import ClassActivityChart from "@/components/dashboard/ClassActivityChart";

const staticStats = {
  totalStudents: 1250,
  studentsGrowthPercent: 12.5,
  totalTeachers: 48,
  teachersGrowthPercent: 4.2,
  totalClasses: 36,
  classesGrowthPercent: 8.1,
  completedHomeworkPercent: 85,
};

const staticUserGrowthData = [
  { name: "Tháng 1", users: 400 },
  { name: "Tháng 2", users: 600 },
  { name: "Tháng 3", users: 800 },
  { name: "Tháng 4", users: 1000 },
  { name: "Tháng 5", users: 1150 },
  { name: "Tháng 6", users: 1298 },
];

const staticClassActivityData = [
  { name: "T2", classes: 12 },
  { name: "T3", classes: 18 },
  { name: "T4", classes: 15 },
  { name: "T5", classes: 22 },
  { name: "T6", classes: 20 },
  { name: "T7", classes: 8 },
  { name: "CN", classes: 4 },
];

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

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {/* 1. Phần Thẻ Thống Kê */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Số lượng học sinh"
          value={staticStats.totalStudents.toLocaleString()}
          description={`+${staticStats.studentsGrowthPercent}% so với tháng trước`}
          icon={Users}
        />
        <StatCard
          title="Số lượng giáo viên"
          value={staticStats.totalTeachers.toLocaleString()}
          description={`+${staticStats.teachersGrowthPercent}% so với tháng trước`}
          icon={GraduationCap}
        />
        <StatCard
          title="Tổng lớp học"
          value={staticStats.totalClasses.toLocaleString()}
          description={`+${staticStats.classesGrowthPercent}% so với tháng trước`}
          icon={BookOpen}
        />
        <StatCard
          title="Bài tập hoàn thành"
          value={staticStats.completedHomeworkPercent + "%"}
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
            <ClassActivityChart data={staticClassActivityData} />
          </CardContent>
        </Card>

        {/* Biểu đồ Tăng trưởng người dùng */}
        <Card>
          <CardHeader>
            <CardTitle>Tăng trưởng người dùng (6 tháng gần đây)</CardTitle>
          </CardHeader>
          <CardContent>
            <UserGrowthChart data={staticUserGrowthData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}