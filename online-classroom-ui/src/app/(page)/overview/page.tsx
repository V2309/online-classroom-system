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
    return <div className="p-8 text-center text-red-500">Không có quyền truy cập</div>;
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
    <div className="h-full bg-gray-100 p-4 md:p-6 lg:p-8 w-full space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Tổng quan Học tập</h1>

      {/* === Section 1: Bài tập chưa nộp (từ overview.tsx) === */}
      <div className="rounded-lg p-4 md:p-6 bg-white shadow-sm">
        <h2 className="font-semibold text-lg md:text-xl mb-4 flex items-center gap-2">
          Bài tập chưa nộp <span className="text-base text-gray-500">• {pendingHomeworks.length}</span>
        </h2>
        <div className="overflow-x-auto">
          {/* Bảng cho Desktop */}
          <table className="min-w-full hidden md:table">
            <thead>
              <tr className="text-gray-500 text-sm">
                <th className="text-left px-4 py-3 font-medium">Tên bài tập</th>
                <th className="text-left px-4 py-3 font-medium">Lớp</th>
                <th className="text-left px-4 py-3 font-medium">Hạn chót</th>
              </tr>
            </thead>
            <tbody>
              {pendingHomeworks.length > 0 ? (
                pendingHomeworks.map((homework) => (
                  <tr key={homework.id} className="border-t hover:bg-blue-50 transition-colors duration-200 cursor-pointer">
                    <td className="flex items-center gap-3 px-4 py-4">
                      <Image src={homework.attachmentImage} alt="Homework" width={32} height={32} />
                      <div>
                        <div className="font-medium text-sm md:text-base">{homework.title}</div>
                        <div className="text-xs text-gray-500">Chưa làm</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">{homework.className}</td>
                    <td className="px-4 py-4 text-sm">
                      {homework.endTime
                        ? new Date(homework.endTime).toLocaleString('vi-VN')
                        : 'Không có'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t">
                  <td colSpan={3} className="px-4 py-4 text-center text-gray-500">
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
                <div key={homework.id} className="bg-white rounded-lg shadow-sm p-4 mb-3 border border-gray-200 hover:bg-blue-50 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <Image src={homework.attachmentImage} alt="Homework" width={32} height={32} />
                    <div>
                      <div className="font-semibold">{homework.title}</div>
                      <div className="text-sm text-gray-500">Lớp: {homework.className}</div>
                      <div className="text-sm text-red-500 mt-1">
                        Hạn chót: {homework.endTime
                          ? new Date(homework.endTime).toLocaleString('vi-VN')
                          : 'Không có'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-6">
                Tuyệt vời! Không có bài tập nào sắp hết hạn.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === Section 2: Thành tích học tập (từ results.tsx) === */}
      <div className="rounded-lg p-4 md:p-6 bg-white shadow-sm">
         <h2 className="font-semibold text-lg md:text-xl mb-4 flex items-center gap-2">
           Thành tích học tập theo lớp
         </h2>
      </div>

      {/* Lặp qua từng lớp */}
      {classResults.map((cls, idx) => (
        <div key={idx} className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold mb-2 text-blue-600">Lớp: {cls.className}</h3>
          <p className="text-sm text-gray-600 mb-4">Giáo viên: {cls.teacherName}</p>

          {/* Thống kê của lớp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Điểm TB */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="text-sm font-medium text-blue-700">Điểm TB (cao nhất)</div>
              <span className={`text-3xl font-bold ${
                  cls.averageGrade === 'Chưa có điểm' ? 'text-gray-500'
                  : parseFloat(cls.averageGrade) >= 8 ? 'text-green-600'
                  : parseFloat(cls.averageGrade) >= 6.5 ? 'text-yellow-600'
                  : 'text-red-600'
              }`}>
                {cls.averageGrade}
              </span>
            </div>
            
            {/* Tỷ lệ hoàn thành */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="text-sm font-medium text-green-700">Tỷ lệ hoàn thành</div>
              <div className="flex items-center gap-2 mt-2">
                 <div className="w-full bg-gray-200 rounded-full h-2">
                   <div
                     className={`h-2 rounded-full ${
                       cls.completionRate >= 80 ? 'bg-green-500'
                       : cls.completionRate >= 60 ? 'bg-yellow-500'
                       : 'bg-red-500'
                     }`}
                     style={{ width: `${cls.completionRate}%` }}
                   ></div>
                 </div>
                 <span className="text-lg font-bold text-gray-600">{cls.completionRate}%</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">{cls.completedHomeworks}/{cls.totalHomeworks} bài tập</div>
            </div>
          </div>

          {/* Biểu đồ điểm các bài tập */}
          {cls.chartData.length > 0 ? (
            <div className="mb-8">
              <h4 className="text-md font-semibold mb-2 text-slate-700">Biểu đồ điểm số</h4>
              <StudentHomeworkChart homeworks={cls.chartData} totalHomeworks={cls.totalHomeworks} />
            </div>
          ) : (
            <div className="mb-8 text-gray-500">Chưa có bài tập đã nộp để hiển thị biểu đồ.</div>
          )}

          {/* Bảng điểm chi tiết - Chỉ hiển thị bài tập đã có điểm */}
          <h4 className="text-md font-semibold mb-2 text-slate-700">Bảng điểm chi tiết</h4>
          {cls.tableData.filter((item: any) => item.grade !== null && item.grade !== undefined).length > 0 ? (
            <Table
              columns={[
                { header: 'Tên bài tập', accessor: 'title' },
                { header: 'Điểm cao nhất', accessor: 'grade' },
                { header: 'Ngày nộp', accessor: 'submittedAt' },
              ]}
              data={cls.tableData.filter((item: any) => item.grade !== null && item.grade !== undefined)}
              renderRow={(item: any) => (
                <tr key={item.title} className="border-t hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 font-medium">{item.title}</td>
                  <td className={`px-4 py-2 font-semibold ${
                    item.grade >= 8 ? 'text-green-600'
                    : item.grade >= 6.5 ? 'text-yellow-600'
                    : 'text-red-600'
                  }`}>
                    {item.grade}
                  </td>
                  <td className="px-4 py-2">{item.submittedAt ? new Date(item.submittedAt).toLocaleString('vi-VN') : '-'}</td>
                </tr>
              )}
            />
          ) : (
            <div className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg">
              Chưa có bài tập nào được chấm điểm
            </div>
          )}
        </div>
      ))}
    </div>
  );
}