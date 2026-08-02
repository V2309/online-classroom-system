"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Save, User, Clock, FileText } from "lucide-react";
import { toast } from "react-toastify";

interface Student {
  id: string;
  username: string;
  img?: string | null;
}

interface Question {
  id: number;
  content: string;
  point: number | null;
}

interface Homework {
  id: number;
  title: string;
  type: string | null;
  questions: Question[];
  class: {
    name: string;
    class_code: string | null;
  } | null;
}

interface Submission {
  id: number;
  content: string;
  submittedAt: Date;
  grade: number | null;
  timeSpent: number | null;
  feedback: string | null;
  student: Student;
  homework: Homework;
}

interface HomeworkGradingClientProps {
  submission: Submission;
  answers: Record<string | number, string | { answer?: string; score?: number; feedback?: string }>; // Object với key là questionId, value là answer string hoặc object
  classId: string;
}

export default function HomeworkGradingClient({
  submission,
  answers,
  classId,
}: HomeworkGradingClientProps) {
  const router = useRouter();
  const [grades, setGrades] = useState<Record<number, number>>(() => {
    // Initialize với điểm hiện tại từ database nếu có
    const initialGrades: Record<number, number> = {};
    
    // Parse điểm cũ từ content nếu đã chấm
    let existingGrades: any = {};
    try {
      if (submission.content && typeof submission.content === 'string') {
        existingGrades = JSON.parse(submission.content);
      } else if (submission.content && typeof submission.content === 'object') {
        existingGrades = submission.content;
      }
    } catch (error) {
      console.error("Error parsing existing grades:", error);
    }
    
    submission.homework.questions.forEach(q => {
      // Lấy điểm cũ nếu có, ngược lại mặc định là 0
      let existingScore = 0;
      
      const questionData = existingGrades[q.id] || existingGrades[q.id.toString()];
      if (questionData) {
        if (typeof questionData === 'object' && questionData.score !== undefined) {
          existingScore = questionData.score;
        }
        // Nếu questionData là string thì chưa có điểm, giữ mặc định 0
      }
      
      initialGrades[q.id] = existingScore;
    });
    

    return initialGrades;
  });
  
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const [loading, setLoading] = useState(false);

  // answers đã là object với key là questionId

  const formatTimeSpent = (timeSpent: number | null) => {
    if (!timeSpent) return '--';
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    return `${minutes} phút ${seconds} giây`;
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

  const handleGradeChange = (questionId: number, grade: number) => {
    setGrades(prev => ({
      ...prev,
      [questionId]: grade
    }));
  };

  const calculateTotalGrade = () => {
    const totalMaxPoints = submission.homework.questions.reduce((sum, q) => sum + (q.point || 0), 0);
    const earnedPoints = Object.entries(grades).reduce((sum, [questionId, grade]) => {
      const question = submission.homework.questions.find(q => q.id === Number(questionId));
      const questionMaxPoint = question?.point || 0;
      // grade hiện tại là điểm thực của câu hỏi, không cần chia cho 10
      return sum + Math.min(grade, questionMaxPoint); // Đảm bảo không vượt quá điểm tối đa
    }, 0);
    
    // Trả về tổng điểm thực tế
    return earnedPoints;
  };
  
  const getTotalMaxPoints = () => {
    return submission.homework.questions.reduce((sum, q) => sum + (q.point || 0), 0);
  };

  const handleSubmitGrades = async () => {
    setLoading(true);
    try {
      const totalGrade = calculateTotalGrade();
      const totalMaxPoints = getTotalMaxPoints();
      
      // Tính điểm theo thang 10 để lưu vào database
      const gradeOutOf10 = totalMaxPoints > 0 ? (totalGrade / totalMaxPoints) * 10 : 0;
      
      const response = await fetch(`/api/homework/${submission.homework.id}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: submission.id,
          grade: gradeOutOf10, // Điểm theo thang 10 cho database
          feedback: feedback,
          questionGrades: grades, // Điểm thực từng câu
        }),
      });

      if (response.ok) {
        toast.success("Đã chấm điểm thành công!");
        
        // Revalidate server data trước khi navigate
        router.refresh();
        
        // Navigate với timestamp để force refresh
        const timestamp = new Date().getTime();
        router.push(`/class/${classId}/homework/${submission.homework.id}/teacher-detail?_t=${timestamp}`);
      } else {
        toast.error("Có lỗi xảy ra khi chấm điểm");
      }
    } catch (error) {
      console.error("Error grading:", error);
      toast.error("Có lỗi xảy ra khi chấm điểm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/class/${classId}/homework/${submission.homework.id}/teacher-detail`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Chấm bài: {submission.homework.title}</h1>
                <p className="text-sm text-gray-500">{submission.homework.class?.name || 'Không xác định'}</p>
              </div>
            </div>
            <button
              onClick={handleSubmitGrades}
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              <span>{loading ? "Đang lưu..." : "Lưu điểm"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin học sinh</h3>
              
              <div className="flex items-center mb-4">
                {submission.student.img ? (
                  <Image
                src={`${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}${submission.student.img}`}
                    alt={submission.student.username}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <User size={20} className="text-gray-600" />
                  </div>
                )}
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{submission.student.username}</p>
                  
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Clock size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-600">Thời gian làm: </span>
                  <span className="ml-1 font-medium">{formatTimeSpent(submission.timeSpent)}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <FileText size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-600">Nộp lúc: </span>
                  <span className="ml-1 font-medium">{formatDateTime(submission.submittedAt)}</span>
                </div>
              </div>
            </div>

            {/* Grading summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tổng kết điểm</h3>
              
              <div className="space-y-3">
                {submission.homework.questions.map((question) => (
                  <div key={question.id} className="flex justify-between text-sm">
                    <span>Câu {submission.homework.questions.indexOf(question) + 1}:</span>
                    <span className="font-medium">
                      {Math.min(grades[question.id] || 0, question.point || 0)}/{question.point || 0} điểm
                    </span>
                  </div>
                ))}
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-medium">
                    <span>Tổng điểm:</span>
                    <span className="text-blue-600">{calculateTotalGrade()}/{getTotalMaxPoints()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Questions and answers */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {submission.homework.questions.map((question, index) => (
                <div key={question.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      Câu {index + 1} ({question.point || 0} điểm)
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Điểm:</span>
                      <input
                        type="number"
                        min="0"
                        max={question.point || 0}
                        step="0.5"
                        value={grades[question.id] || 0}
                        onChange={(e) => {
                          const value = Math.min(Number(e.target.value), question.point || 0);
                          handleGradeChange(question.id, value);
                        }}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm w-16 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">/{question.point || 0}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-900 whitespace-pre-line">{question.content}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Câu trả lời của học sinh:</h5>
                    <div className="text-gray-900 whitespace-pre-line">
                      {(() => {
                        const answerData = answers[question.id] || answers[question.id.toString()];
                        if (typeof answerData === 'string') {
                          return answerData || "Không có câu trả lời";
                        } else if (typeof answerData === 'object' && answerData?.answer) {
                          return answerData.answer;
                        }
                        return "Không có câu trả lời";
                      })()}
                    </div>
                  </div>
                </div>
              ))}

              {/* Feedback section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Nhận xét chung</h4>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Nhập nhận xét cho học sinh..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}