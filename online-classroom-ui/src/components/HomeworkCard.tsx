"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { homeworkService } from "@/services/homework.service";
import { FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface HomeworkCardProps {
  homework: {
    id: number;
    title: string;
    description: string | null;
    type?: string | null;
    points?: number | null;
    createdAt: Date;
    endTime?: Date | string | null;
    studentViewPermission?: "NO_VIEW" | "SCORE_ONLY" | "SCORE_AND_RESULT";
    gradingMethod?: "FIRST_ATTEMPT" | "LATEST_ATTEMPT" | "HIGHEST_ATTEMPT";
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
  const subjectName = homework.subject?.name || "Chung";
  const description = homework.description || "Không có mô tả chi tiết";

  const homeworkType =
    homework.type === "extracted"
      ? "Trắc nghiệm tách câu"
      : homework.type === "essay"
      ? "Tự luận"
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

  const maxPoints =
    homework.type === "essay" && homework.questions
      ? Math.round(homework.questions.reduce((sum, q) => sum + (q.point || 0), 0) * 100) / 100
      : Math.round((homework.points || 10) * 100) / 100;

  const canViewScore = homework.studentViewPermission !== "NO_VIEW";
  const isExpired = homework.endTime ? new Date() > new Date(homework.endTime) : false;
  const shouldShowScore = canViewScore || isExpired;

  const attachmentType = homework.attachments?.[0]?.type || "Not found";
  const attachmentImage =
    homework.type === "essay"
      ? "/essay.png"
      : attachmentType === "application/pdf"
      ? "/pdf_red.png"
      : "/doc_blue.png";

  return (
    <div className="bg-white rounded-3xl shadow-2xs p-4 sm:p-5 border border-border hover:border-primary/40 hover:shadow-md transition-all text-foreground">
      <div className="flex items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-card border border-border/80 flex items-center justify-center flex-shrink-0 p-2 shadow-2xs">
            <Image src={attachmentImage} alt="" width={32} height={32} className="object-contain" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-heading font-bold text-foreground truncate">
              {homework.title}
            </h3>
            <p className="text-secondary text-xs mt-0.5 line-clamp-1">{description}</p>

            <div className="mt-2 flex items-center text-[11px] sm:text-xs text-muted-foreground gap-3 flex-wrap font-medium">
              <span className="bg-muted px-2.5 py-0.5 rounded-full text-secondary font-semibold">
                {homeworkType}
              </span>
              <span>
                <b>{role === "teacher" ? "Đã nộp:" : "Môn:"}</b>{" "}
                {role === "teacher" ? submissionStats : subjectName}
              </span>
            </div>
          </div>
        </div>

        {/* Điểm của học sinh */}
        {role === "student" && currentGrade !== null && shouldShowScore && (
          <div className="flex-shrink-0">
            <div className="px-3 py-1 bg-accent text-primary rounded-full text-xs font-bold border border-primary/20 select-none shadow-2xs">
              {Math.round(currentGrade * 100) / 100}/{maxPoints} đ
            </div>
          </div>
        )}

        {role === "student" && currentGrade === null && shouldShowScore && (
          <div className="flex-shrink-0">
            <div className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-bold select-none border border-rose-200">
              Chưa làm
            </div>
          </div>
        )}

        {role === "student" && !shouldShowScore && (
          <div className="flex-shrink-0">
            <div className="px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold select-none border border-amber-200">
              {isExpired ? "Đang chấm" : "Chờ hết hạn"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}