import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser } from '@/lib/auth-server';
import Table from '@/components/Table';
import dynamic from 'next/dynamic';
import { serverFetch } from '@/lib/server-api';

// Tải bất đồng bộ component biểu đồ để không làm chậm server
const StudentHomeworkChart = dynamic(() => import('@/components/StudentHomeworkChart'), { ssr: false });

export default async function OverviewPage() {
  const user = getCurrentUser();

  if (!user || user.role !== 'student') {
    return <div className="p-8 text-center text-destructive">Không có quyền truy cập</div>;
  }

  let overviewData = {
    pendingHomeworks: [] as any[],
    classResults: [] as any[],
  };

  try {
    overviewData = await serverFetch('/homework/student/overview');
  } catch (error) {
    console.error('Error fetching student overview:', error);
  }

  const { pendingHomeworks = [], classResults = [] } = overviewData || {};

  // === RENDER GIAO DIỆN ===
  return (
    <div className="h-full bg-background p-4 md:p-6 lg:p-8 w-full space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Tổng quan Học tập</h1>

      {/* === Section 1: Bài tập chưa nộp (từ overview.tsx) === */}
      <div className="rounded-xl p-4 md:p-6 bg-card border border-border shadow-sm">
        <h2 className="font-semibold text-lg md:text-xl mb-4 flex items-center gap-2 text-foreground">
          Bài tập chưa nộp <span className="text-base text-muted-foreground">• {pendingHomeworks.length}</span>
        </h2>
        <div className="overflow-x-auto">
          {/* Bảng cho Desktop */}
          <table className="min-w-full hidden md:table">
            <thead>
              <tr className="text-muted-foreground text-sm border-b border-border">
                <th className="text-left px-4 py-3 font-medium">Tên bài tập</th>
                <th className="text-left px-4 py-3 font-medium">Lớp</th>
                <th className="text-left px-4 py-3 font-medium">Hạn chót</th>
              </tr>
            </thead>
            <tbody>
              {pendingHomeworks.length > 0 ? (
                pendingHomeworks.map((homework) => (
                  <tr key={homework.id} className="border-t border-border hover:bg-accent transition-colors duration-200 cursor-pointer">
                    <td className="flex items-center gap-3 px-4 py-4">
                      <Image src={homework.attachmentImage} alt="Homework" width={32} height={32} />
                      <div>
                        <div className="font-medium text-sm md:text-base text-foreground">{homework.title}</div>
                        <div className="text-xs text-muted-foreground">Chưa làm</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-secondary">{homework.className}</td>
                    <td className="px-4 py-4 text-sm text-secondary">
                      {homework.endTime
                        ? new Date(homework.endTime).toLocaleString('vi-VN')
                        : 'Không có'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-border">
                  <td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">
                    Tuyệt vời! Không có bài tập nào sắp hết hạn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Giao diện cho Mobile */}
          <div className="md:hidden">
            {pendingHomeworks.length > 0 ? (
              pendingHomeworks.map((homework) => (
                <div key={homework.id} className="bg-card rounded-xl shadow-sm p-4 mb-3 border border-border hover:bg-accent transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <Image src={homework.attachmentImage} alt="Homework" width={32} height={32} />
                    <div>
                      <div className="font-semibold text-foreground">{homework.title}</div>
                      <div className="text-sm text-muted-foreground">Lớp: {homework.className}</div>
                      <div className="text-sm text-destructive mt-1">
                        Hạn chót: {homework.endTime
                          ? new Date(homework.endTime).toLocaleString('vi-VN')
                          : 'Không có'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-6">
                Tuyệt vời! Không có bài tập nào sắp hết hạn.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === Section 2: Thành tích học tập (từ results.tsx) === */}
      <div className="rounded-xl p-4 md:p-6 bg-card border border-border shadow-sm">
         <h2 className="font-semibold text-lg md:text-xl mb-4 flex items-center gap-2 text-foreground">
           Thành tích học tập theo lớp
         </h2>
      </div>

      {/* Lặp qua từng lớp */}
      {classResults.map((cls, idx) => (
        <div key={idx} className="bg-card rounded-xl p-4 md:p-6 shadow-sm border border-border">
          <h3 className="text-xl font-semibold mb-2 text-primary">Lớp: {cls.className}</h3>
          <p className="text-sm text-secondary mb-4">Giáo viên: {cls.teacherName}</p>

          {/* Thống kê của lớp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Điểm TB */}
            <div className="bg-accent p-4 rounded-xl border border-border">
              <div className="text-sm font-medium text-primary">Điểm TB (cao nhất)</div>
              <span className={`text-3xl font-bold ${
                  cls.averageGrade === 'Chưa có điểm' ? 'text-muted-foreground'
                  : parseFloat(cls.averageGrade) >= 8 ? 'text-state-success'
                  : parseFloat(cls.averageGrade) >= 6.5 ? 'text-state-warning'
                  : 'text-destructive'
              }`}>
                {cls.averageGrade}
              </span>
            </div>
            
            {/* Tỷ lệ hoàn thành */}
            <div className="bg-state-success/10 p-4 rounded-xl border border-state-success/20">
              <div className="text-sm font-medium text-state-success">Tỷ lệ hoàn thành</div>
              <div className="flex items-center gap-2 mt-2">
                 <div className="w-full bg-muted rounded-full h-2">
                   <div
                     className={`h-2 rounded-full ${
                       cls.completionRate >= 80 ? 'bg-state-success'
                       : cls.completionRate >= 60 ? 'bg-state-warning'
                       : 'bg-destructive'
                     }`}
                     style={{ width: `${cls.completionRate}%` }}
                   ></div>
                 </div>
                 <span className="text-lg font-bold text-foreground">{cls.completionRate}%</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{cls.completedHomeworks}/{cls.totalHomeworks} bài tập</div>
            </div>
          </div>

          {/* Biểu đồ điểm các bài tập */}
          {cls.chartData.length > 0 ? (
            <div className="mb-8">
              <h4 className="text-md font-semibold mb-2 text-foreground">Biểu đồ điểm số</h4>
              <StudentHomeworkChart homeworks={cls.chartData} totalHomeworks={cls.totalHomeworks} />
            </div>
          ) : (
            <div className="mb-8 text-muted-foreground">Chưa có bài tập đã nộp để hiển thị biểu đồ.</div>
          )}

          {/* Bảng điểm chi tiết - Chỉ hiển thị bài tập đã có điểm */}
          <h4 className="text-md font-semibold mb-2 text-foreground">Bảng điểm chi tiết</h4>
          {cls.tableData.filter((item: any) => item.grade !== null && item.grade !== undefined).length > 0 ? (
            <Table
              columns={[
                { header: 'Tên bài tập', accessor: 'title' },
                { header: 'Điểm cao nhất', accessor: 'grade' },
                { header: 'Ngày nộp', accessor: 'submittedAt' },
              ]}
              data={cls.tableData.filter((item: any) => item.grade !== null && item.grade !== undefined)}
              renderRow={(item: any) => (
                <tr key={item.title} className="border-t border-border hover:bg-accent transition-colors">
                  <td className="px-4 py-2 font-medium text-foreground">{item.title}</td>
                  <td className={`px-4 py-2 font-semibold ${
                    item.grade >= 8 ? 'text-state-success'
                    : item.grade >= 6.5 ? 'text-state-warning'
                    : 'text-destructive'
                  }`}>
                    {item.grade}
                  </td>
                  <td className="px-4 py-2 text-secondary">{item.submittedAt ? new Date(item.submittedAt).toLocaleString('vi-VN') : '-'}</td>
                </tr>
              )}
            />
          ) : (
            <div className="text-center text-muted-foreground py-6 bg-muted/50 rounded-xl border border-border">
              Chưa có bài tập nào được chấm điểm
            </div>
          )}
        </div>
      ))}
    </div>
  );
}