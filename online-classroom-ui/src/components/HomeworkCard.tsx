// components/HomeworkCard.tsx
import Image from "next/image";
import { useState, useEffect } from "react";
import { homeworkService } from "@/services/homework.service";

interface HomeworkCardProps {
  homework: {
    id: number;
    title: string;
    description: string | null;
    type?: string | null;
    points?: number | null;
    createdAt: Date;
    endTime?: Date | string | null;
    studentViewPermission?: 'NO_VIEW' | 'SCORE_ONLY' | 'SCORE_AND_RESULT';
    gradingMethod?: 'FIRST_ATTEMPT' | 'LATEST_ATTEMPT' | 'HIGHEST_ATTEMPT';
    class: {
      name: string;
      class_code: string | null;
    } | null;
    subject?: {
      name: string;
    } | null;
    questions?: {
      id: number;
      point: number | null;
    }[] | null;
    attachments?: {
      type: string;
      url: string;
    }[] | null;
    submissions?: {
      grade: number | null;
      studentId?: string;
    }[];
    totalStudents?: number;
    completedStudents?: number;
  };
  role?: string;
}

export function HomeworkCard({ homework, role }: HomeworkCardProps) {
  const classInfo = homework.class || { name: "Không xác định", class_code: "" };
  const subjectName = homework.subject?.name || "Không";
  const description = homework.description || "Không có mô tả";
  
  const homeworkType = homework.type === "extracted" ? "Trắc nghiệm tách câu" 
    : homework.type === "essay" ? "Tự luận" 
    : "Trắc nghiệm";
  
  const completedCount = homework.completedStudents || 0;
  const totalStudents = homework.totalStudents || 0;
  const submissionStats = `${completedCount}/${totalStudents} đã làm`;
  
  const [currentGrade, setCurrentGrade] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (role === "student") {
      const fetchGrade = async () => {
        try {
          const data: any = await homeworkService.getSubmissionsCount(homework.id);
          if (data) {
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

  const maxPoints = homework.type === 'essay' && homework.questions 
    ? Math.round((homework.questions.reduce((sum, q) => sum + (q.point || 0), 0)) * 100) / 100
    : Math.round((homework.points || 0) * 100) / 100;
  
  const canViewScore = homework.studentViewPermission !== 'NO_VIEW';
  const isExpired = homework.endTime ? new Date() > new Date(homework.endTime) : false;
  const shouldShowScore = canViewScore || isExpired;

  const attachmentType = homework.attachments?.[0]?.type || "Not found";
  const attachmentImage = homework.type === "essay" 
    ? "/essay.png" 
    : attachmentType === "application/pdf"
      ? "/pdf_red.png" 
      : "/doc_blue.png";

  return (
    <div 
      className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-5 border border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 text-foreground"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-muted/60 flex items-center justify-center flex-shrink-0 p-2 border border-border/50">
            <Image src={attachmentImage} alt="" width={32} height={32} className="object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-foreground truncate">{homework.title}</h3>
            <p className="text-secondary text-sm mt-0.5 line-clamp-2">{description}</p>
            
            <div className="mt-2.5 flex items-center text-xs sm:text-sm text-muted-foreground gap-4 flex-wrap">
              <span>
                <span className="font-semibold text-foreground">Loại:</span> {homeworkType}
              </span>
              <span>
                <span className="font-semibold text-foreground">
                  {role === "teacher" ? "Học sinh:" : "Môn:"}
                </span> {role === "teacher" ? submissionStats : subjectName}
              </span>
            </div>
          </div>
        </div>

        {/* Label điểm bên phải */}
        {role === "student" && currentGrade !== null && shouldShowScore && (
          <div className="flex-shrink-0">
            <div className="px-3.5 py-1.5 bg-accent text-primary rounded-full text-xs sm:text-sm font-semibold border border-primary/20 select-none">
              {Math.round(currentGrade * 100) / 100}/{maxPoints} điểm
            </div>
          </div>
        )}
        
        {role === "student" && currentGrade === null && shouldShowScore && (
          <div className="flex-shrink-0">
            <div className="px-3.5 py-1.5 bg-destructive/10 text-destructive rounded-full text-xs sm:text-sm font-semibold select-none">
              Chưa làm
            </div>
          </div>
        )}
        
        {role === "student" && !shouldShowScore && (
          <div className="flex-shrink-0">
            <div className="px-3.5 py-1.5 bg-amber-500/10 text-amber-800 rounded-full text-xs sm:text-sm font-semibold select-none">
              {isExpired ? "Điểm đang chấm" : "Điểm sau hết hạn"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}