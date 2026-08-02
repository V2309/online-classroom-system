"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, User, FileText, Edit3 } from "lucide-react";

interface Student {
  id: string;
  username: string;
  img?: string | null;
}

interface Submission {
  id: number;
  content: string;
  submittedAt: Date;
  grade: number | null;
  timeSpent: number | null;
  feedback: string | null;
  student: Student;
}

interface Homework {
  id: number;
  title: string;
  description: string | null;
  type: string | null;
  duration: number | null;
  startTime: Date | null;
  endTime: Date | null;
  maxAttempts: number | null;
  questions: Array<{
    id: number;
    content: string;
    point: number | null;
  }>;
  class: {
    name: string;
    class_code: string | null;
  } | null;
}

interface HomeworkTeacherDetailClientProps {
  homework: Homework;
  submissions: Submission[];
  allStudents: Student[];
  classId: string;
}

export default function HomeworkTeacherDetailClient({
  homework,
  submissions,
  allStudents,
  classId,
}: HomeworkTeacherDetailClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'submitted' | 'not-submitted'>('all');

  // Tạo map để dễ tìm submission
  const submissionMap = new Map();
  submissions.forEach(sub => {
    submissionMap.set(sub.student.id, sub);
  });

  // Lọc danh sách học sinh
  const getFilteredStudents = () => {
    switch (filter) {
      case 'submitted':
        return allStudents.filter(student => submissionMap.has(student.id));
      case 'not-submitted':
        return allStudents.filter(student => !submissionMap.has(student.id));
      default:
        return allStudents;
    }
  };

  const filteredStudents = getFilteredStudents();
  const submittedCount = submissions.length;
  const totalStudents = allStudents.length;

  const formatTimeSpent = (timeSpent: number | null) => {
    if (!timeSpent) return '--';
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    return `${minutes}m ${seconds}s`;
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const handleGradeSubmission = (submissionId: number) => {
    router.push(`/class/${classId}/homework/${homework.id}/grade/${submissionId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/class/${classId}/homework/list`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{homework.title}</h1>
                <p className="text-sm text-gray-500">{homework.class?.name || 'Không xác định'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Tự luận
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng số học sinh</p>
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đã nộp bài</p>
                <p className="text-2xl font-bold text-gray-900">{submittedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chưa nộp</p>
                <p className="text-2xl font-bold text-gray-900">{totalStudents - submittedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Edit3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đã chấm</p>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.filter(s => s.grade !== null && s.grade > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'all', label: 'Tất cả', count: totalStudents },
                { key: 'submitted', label: 'Đã nộp', count: submittedCount },
                { key: 'not-submitted', label: 'Chưa nộp', count: totalStudents - submittedCount },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {/* Student list */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Họ và tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Điểm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời lượng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày nộp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {homework.type === 'essay' ? 'Nhận xét' : 'Tổng số tệp'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {homework.type === 'essay' ? 'Số câu' : 'Rời khỏi'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student, index) => {
                  const submission = submissionMap.get(student.id);
                  const isSubmitted = !!submission;
                  const isGraded = submission?.grade !== null && submission?.grade !== undefined;

                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <input type="checkbox" className="rounded" />
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            {student.img ? (
                              <Image
                              src={`${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}${student.img}`}
                                alt={student.username}
                                width={32}
                                height={32}
                                className="h-8 w-8 rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  if (target.nextElementSibling) {
                                    (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div className={`h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center ${student.img ? 'hidden' : ''}`}>
                              <span className="text-xs font-medium text-gray-700">
                                {student.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {student.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isSubmitted ? (
                          isGraded ? (
                            <span className="text-green-600 font-medium">
                              {homework.type === 'essay' ? (
                                // Với bài essay, hiển thị điểm thực tế trực tiếp
                                (() => {
                                  const totalPoints = homework.questions?.reduce((sum: number, q: any) => sum + (q.point || 0), 0) || 100;
                                  return `${Math.round(submission.grade * 100) / 100}/${totalPoints}`;
                                })()
                              ) : (
                                // Với bài trắc nghiệm, giữ nguyên /10
                                `${submission.grade}/10`
                              )}
                            </span>
                          ) : (
                            <span className="text-yellow-600">Chờ chấm</span>
                          )
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isSubmitted ? formatTimeSpent(submission.timeSpent) : '--'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isSubmitted ? formatDateTime(submission.submittedAt) : '--'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {homework.type === 'essay' ? (
                          isSubmitted && submission.feedback ? (
                            <span className="text-blue-600 text-xs">Có nhận xét</span>
                          ) : (
                            '--'
                          )
                        ) : (
                          '--'
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {homework.type === 'essay' ? (
                          isSubmitted ? (
                            homework.questions?.length || 0
                          ) : (
                            '--'
                          )
                        ) : (
                          '0'
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isSubmitted ? (
                          <button
                            onClick={() => handleGradeSubmission(submission.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                          >
                            Chấm bài
                          </button>
                        ) : (
                          <span className="text-gray-400">Chưa nộp</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}