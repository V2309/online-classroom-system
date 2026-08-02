// components/HomeworkCard.tsx
import Image from "next/image";
import { useState, useEffect } from "react";
interface HomeworkCardProps {
  homework: {
    id: number;
    title: string;
    description: string | null; // Thêm null vào kiểu dữ liệu
    type?: string | null; // Thêm type để phân biệt loại bài tập
    points?: number | null; // Thêm null nếu cần
    createdAt: Date;
    endTime?: Date | string | null; // Thêm thời gian hết hạn
    studentViewPermission?: 'NO_VIEW' | 'SCORE_ONLY' | 'SCORE_AND_RESULT'; // Thêm quyền xem điểm
    gradingMethod?: 'FIRST_ATTEMPT' | 'LATEST_ATTEMPT' | 'HIGHEST_ATTEMPT'; // Thêm phương pháp chấm điểm
    class: {
      name: string;
      class_code: string | null; // Thêm null nếu class_code có thể null
    } | null; // Thêm null nếu class có thể null
    subject?: {
      name: string;
    } | null;
    questions?: {
      id: number;
      point: number | null;
    }[] | null;
    attachments?: {
      type: string; // Loại file (ví dụ: "pdf", "image", ...)
      url: string; // URL của file
    }[] | null;
    submissions?: {
      grade: number | null;
      studentId?: string; // Thêm studentId để đếm số học sinh đã làm
    }[]; // Thêm submissions để lấy điểm cao nhất
    totalStudents?: number; // Tổng số học sinh trong lớp
    completedStudents?: number; // Số học sinh đã làm bài
  };
  role?: string; // Thêm role để phân biệt teacher/student
}

export function HomeworkCard({ homework, role }: HomeworkCardProps) {
  // Xử lý giá trị null
  const classInfo = homework.class || { name: "Không xác định", class_code: "" };
  const subjectName = homework.subject?.name || "Không";
  const description = homework.description || "Không có mô tả";
  
  // Xác định loại bài tập
  const homeworkType = homework.type === "extracted" ? "Trắc nghiệm tách câu" 
    : homework.type === "essay" ? "Tự luận" 
    : "Trắc nghiệm";
  
  // Tính số lượng học sinh đã làm (cho teacher)
  const completedCount = homework.completedStudents || 0;
  const totalStudents = homework.totalStudents || 0;
  const submissionStats = `${completedCount}/${totalStudents} đã làm`;
  
  // State để lưu điểm từ API
  const [currentGrade, setCurrentGrade] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lấy điểm từ API giống như HomeWorkInfo
  useEffect(() => {
    if (role === "student") {
      const fetchGrade = async () => {
        try {
          const response = await fetch(`/api/homework/submissions/count?homeworkId=${homework.id}`);
          const data = await response.json();
          if (data.success) {
            setCurrentGrade(data.bestGrade ?? null);
          }
        } catch (error) {
          console.error("Error fetching grade:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchGrade();
    } else {
      setIsLoading(false);
    }
  }, [homework.id, role]);
  // Tính điểm tối đa: với bài essay thì tính từ tổng điểm các câu hỏi, với bài khác dùng homework.points
  const maxPoints = homework.type === 'essay' && homework.questions 
    ? Math.round((homework.questions.reduce((sum, q) => sum + (q.point || 0), 0)) * 100) / 100
    : Math.round((homework.points || 0) * 100) / 100;
  
  // Kiểm tra quyền xem điểm
  const canViewScore = homework.studentViewPermission !== 'NO_VIEW';
  
  // Kiểm tra xem bài tập đã hết hạn chưa
  const isExpired = homework.endTime ? new Date() > new Date(homework.endTime) : false;
  
  // Logic hiển thị điểm: Nếu không có quyền xem và chưa hết hạn -> hiển thị thông báo chờ
  // Nếu đã hết hạn hoặc có quyền xem -> hiển thị điểm thực tế
  const shouldShowScore = canViewScore || isExpired;

// Kiểm tra loại bài tập và file để hiển thị ảnh phù hợp
  const attachmentType = homework.attachments?.[0]?.type || "Not found";
  const attachmentImage = homework.type === "essay" 
    ? "/essay.png" // Bài tự luận hiển thị ảnh essay
    : attachmentType === "application/pdf"
      ? "/pdf_red.png" // PDF hiển thị ảnh PDF
      : "/doc_blue.png"; // Mặc định hiển thị ảnh doc
  return (
    <div 
       className="block bg-white rounded-lg shadow-lg p-4 mb-4 hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-500"
     
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="img">
            <Image src={attachmentImage} alt="" width={40} height={40} className="object-cover" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">{homework.title}</h3>
            <p className="text-gray-600 mt-1 line-clamp-2">{description}</p>
            
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span className="mr-4">
                <span className="font-medium">Loại:</span> {homeworkType}
              </span>
              <span>
                <span className="font-medium">
                  {role === "teacher" ? "Học sinh:" : "Môn:"}
                </span> {role === "teacher" ? submissionStats : subjectName}
              </span>
            </div>
          </div>
        </div>

        {/* Label điểm bên phải - hiển thị cho student khi có quyền xem hoặc đã hết hạn */}
        {role === "student" && currentGrade !== null && shouldShowScore && (
          <div className="flex-shrink-0 ml-4">
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {homework.type === 'essay' ? (
                // Với bài essay, hiển thị điểm thực tế trực tiếp
                `${Math.round(currentGrade * 100) / 100}/${maxPoints}`
              ) : (
                // Với bài trắc nghiệm, giữ nguyên
                `${Math.round(currentGrade * 100) / 100}/${maxPoints}`
              )} điểm
            </div>
          </div>
        )}
        
        {/* Hiển thị "Chưa làm" nếu chưa có submission - khi có quyền xem hoặc đã hết hạn */}
        {role === "student" && currentGrade === null && shouldShowScore && (
          <div className="flex-shrink-0 ml-4">
            <div className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
              Chưa làm
            </div>
          </div>
        )}
        
        {/* Hiển thị thông báo khi không có quyền xem điểm và chưa hết hạn */}
        {role === "student" && !shouldShowScore && (
          <div className="flex-shrink-0 ml-4">
            <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
              {isExpired ? "Điểm đang được chấm" : "Điểm sẽ có sau hết hạn"}
            </div>
          </div>
        )}

        {/* ... phần còn lại giữ nguyên ... */}
      </div>
    </div>
  );
}