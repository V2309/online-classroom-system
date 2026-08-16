// homeworkinfo.tsx
import {
  Eye,
  Info,
  Folder,
  Pencil,
  Printer,
  Download,
  Trash2,
  MonitorPlay,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ExportHomeworkModal from "@/components/ExportHomeworkModal";
import { memo } from "react";
import { homeworkService } from "@/services/homework.service";

/** ================= Types ================= */
type Role = "teacher" | "student";
type DateInput = string | Date | null | undefined;

interface Homework {
  id: number;
  title: string;
  description?: string | null;
  startTime?: DateInput;
  endTime?: DateInput;
  duration?: number | null;
  maxAttempts?: number | null;
  points?: number | null;
  createdAt?: DateInput;
  subject?: { name: string } | null;
  classCode?: string | null;
  class?: { class_code: string } | null;
  studentViewPermission?: 'NO_VIEW' | 'SCORE_ONLY' | 'SCORE_AND_RESULT';
  blockViewAfterSubmit?: boolean;
  gradingMethod?: 'FIRST_ATTEMPT' | 'LATEST_ATTEMPT' | 'HIGHEST_ATTEMPT';
}

/** =============== Component =============== */
export function HomeWorkInfo({
  homework,
  role,
}: {
  homework: Homework;
  role: Role | string;
}) {
  const router = useRouter();

  // thời gian hiện tại (đếm mỗi giây)
  const [currentTime, setCurrentTime] = useState(new Date());

  // thống kê submission (student)
  const [submissionCount, setSubmissionCount] = useState(0);
  const [bestSubmissionId, setBestSubmissionId] = useState<string | null>(null);
  const [currentGrade, setCurrentGrade] = useState<number | null>(null);

  // modal export
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // lấy số lần làm và submission tốt nhất (student)
  useEffect(() => {
    if (role === "student") {
      const fetchSubmissionData = async () => {
        try {
          const data: any = await homeworkService.getSubmissionsCount(homework.id);
          if (data) {
            setSubmissionCount(data.count);
            setBestSubmissionId(data.bestSubmissionId ?? null);
            setCurrentGrade(data.bestGrade ?? null);
          }
        } catch (error) {
          console.error("Error fetching submission data:", error);
        }
      };
      fetchSubmissionData();
    }
  }, [homework.id, role]);

  const getClassCode = (): string | undefined => {
    return homework.classCode ?? homework.class?.class_code ?? undefined;
  };

  const handlePractice = () => {
    const classCode = getClassCode();
    if (classCode) {
      router.push(`/class/${classCode}/homework/${homework.id}/test`);
    } else {
      toast.error("Không tìm thấy mã lớp!");
    }
  };

  const handleViewDetail = () => {
    const classCode = getClassCode();
    if (!classCode) return toast.error("Không tìm thấy mã lớp!");
    
    if (role === "teacher") {
      router.push(`/class/${classCode}/homework/${homework.id}/teacher-detail`);
    } else {
      if (bestSubmissionId) {
        router.push(
          `/class/${classCode}/homework/${homework.id}/detail?utid=${bestSubmissionId}`
        );
      } else {
        router.push(
          `/class/${classCode}/homework/${homework.id}/detail?homeworkId=${homework.id}&getBest=true`
        );
      }
    }
  };

  const handleViewEdit = () => {
    const classCode = getClassCode();
    if (classCode) {
      router.push(`/class/${classCode}/homework/${homework.id}/edit`);
    } else {
      toast.error("Không tìm thấy mã lớp!");
    }
  };

  const handleDownload = async () => {
    try {
      toast.info("Đang chuẩn bị file để tải...");
      const data: any = await homeworkService.getDownloadInfo(homework.id);
      
      if (data && data.fileUrl) {
        const link = document.createElement('a');
        link.href = data.fileUrl;
        const fileName = data.fileName || `${homework.title.replace(/[^a-zA-Z0-9\s]/g, '')}.pdf`;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Đã tải file: ${fileName}`);
      } else {
        toast.error("Không tìm thấy file để tải về");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Có lỗi xảy ra khi tải file");
    }
  };

  const getHomeworkStatus = () => {
    if (role !== "student") return null;

    const startTime = homework.startTime ? new Date(homework.startTime) : null;
    const endTime = homework.endTime ? new Date(homework.endTime) : null;
    const maxAttempts = homework.maxAttempts || 1;

    if (startTime && currentTime < startTime) {
      const timeDiff = startTime.getTime() - currentTime.getTime();
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      return {
        type: "notStarted" as const,
        message: `Chưa bắt đầu (còn ${hours > 0 ? `${hours} giờ ` : ""}${minutes} phút)`,
        canTake: false,
      };
    }

    if (endTime && currentTime > endTime) {
      return {
        type: "expired" as const,
        message: "Đã hết hạn nộp bài",
        canTake: false,
      };
    }

    if (submissionCount >= maxAttempts) {
      return {
        type: "maxAttempts" as const,
        message: `Đã hết lượt làm bài (${submissionCount}/${maxAttempts})`,
        canTake: false,
      };
    }

    return { type: "available" as const, message: "Có thể làm bài", canTake: true };
  };

  const homeworkStatus = getHomeworkStatus();

  return (
    <div className="space-y-4 text-foreground">
      <div>
        <h2 className="text-xl font-bold text-foreground leading-tight">{homework.title}</h2>
        {homework.description && (
          <p className="mt-1.5 text-sm text-secondary line-clamp-3">{homework.description}</p>
        )}
      </div>

      {/* Trạng thái bài tập (student) */}
      {role === "student" && homeworkStatus && (
        <div
          className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            homeworkStatus.type === "available"
              ? "bg-accent/60 border-primary/30 text-primary"
              : "bg-amber-500/10 border-amber-500/30 text-amber-800"
          }`}
        >
          {homeworkStatus.type === "available" ? (
            <Clock size={16} className="text-primary flex-shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-amber-800 flex-shrink-0" />
          )}
          <span>{homeworkStatus.message}</span>
        </div>
      )}

      {/* Grid thông tin chi tiết */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 py-3 border-y border-border">
        <InfoItem label="Tổng điểm" value={homework.points ? (Math.round(homework.points * 100) / 100).toString() : "Không"} />
        <InfoItem label="Thời gian bắt đầu" value={formatDateTime(homework.startTime)} />
        <InfoItem label="Hạn chót nộp bài" value={formatDateTime(homework.endTime)} />
        <InfoItem
          label="Thời lượng"
          value={homework.duration ? `${homework.duration} phút` : "Không"}
        />
        <InfoItem
          label="Số lần làm tối đa"
          value={homework.maxAttempts?.toString() || "Không"}
        />
        <InfoItem label="Ngày tạo" value={formatDateTime(homework.createdAt)} />

        <InfoItem
          label="Cách tính điểm"
          value={
            homework.gradingMethod === 'FIRST_ATTEMPT' ? 'Lần đầu tiên' :
              homework.gradingMethod === 'LATEST_ATTEMPT' ? 'Lần mới nhất' :
                homework.gradingMethod === 'HIGHEST_ATTEMPT' ? 'Điểm cao nhất' :
                  'Lần đầu tiên'
          }
        />
        <InfoItem
          label="Xem kết quả"
          value={
            homework.studentViewPermission === 'NO_VIEW' ? 'Không xem điểm' :
              homework.studentViewPermission === 'SCORE_ONLY' ? 'Chỉ xem điểm' :
                homework.studentViewPermission === 'SCORE_AND_RESULT' ? 'Xem đầy đủ' :
                  'Không xác định'
          }
        />

        {role === "student" && (() => {
          const isExpired = homework.endTime ? new Date() > new Date(homework.endTime) : false;
          const canViewScore = homework.studentViewPermission !== 'NO_VIEW';
          const shouldShowScore = canViewScore || isExpired;

          return (
            <>
              <InfoItem
                label="Đã làm"
                value={`${submissionCount}/${homework.maxAttempts || 1} lần`}
              />
              {shouldShowScore && currentGrade !== null && (
                <InfoItem
                  label="Điểm của bạn"
                  value={`${Math.round(currentGrade * 100) / 100}/${Math.round((homework.points || 10) * 100) / 100}`}
                />
              )}
              {!shouldShowScore && (
                <InfoItem
                  label="Điểm"
                  value={isExpired ? "Đang chấm" : "Sau hết hạn"}
                />
              )}
            </>
          );
        })()}
      </div>

      {/* Menu thao tác */}
      <div className="pt-2">
        <ul className="space-y-1.5">
          {role === "teacher" ? (
            <>
              <MenuItem icon={<MonitorPlay size={17} />} onClick={handlePractice} label="Làm thử" />
              <MenuItem icon={<Info size={17} />} onClick={handleViewDetail} label="Chi tiết nộp bài" active />
              <MenuItem icon={<Pencil size={17} />} onClick={handleViewEdit} label="Chỉnh sửa bài tập" />
              <MenuItem
                icon={<Printer size={17} />}
                label="Xuất dữ liệu"
                onClick={() => setShowExport(true)}
              />
              <MenuItem 
                icon={<Download size={17} />} 
                label="Tải về file đề" 
                onClick={handleDownload}
              />
              <DeleteButton homeworkId={homework.id} homeworkData={homework} />
            </>
          ) : role === "student" ? (
            <>
              <MenuItem
                icon={<Eye size={17} />}
                onClick={homeworkStatus?.canTake ? handlePractice : undefined}
                label="Làm bài tập"
                active={homeworkStatus?.canTake}
                disabled={!homeworkStatus?.canTake}
              />
              {submissionCount > 0 && (
                <MenuItem icon={<Info size={17} />} onClick={handleViewDetail} label="Xem kết quả bài làm" />
              )}
            </>
          ) : null}
        </ul>
      </div>

      {/* Modal export */}
      <ExportHomeworkModal
        homeworkId={homework.id}
        open={showExport}
        onClose={() => setShowExport(false)}
      />
    </div>
  );
}

/** =============== Subcomponents =============== */
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs font-medium">{label}</div>
      <div className="font-semibold text-foreground text-xs sm:text-sm mt-0.5">{value}</div>
    </div>
  );
}

type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
  disabled?: boolean;
};

function MenuItem({ icon, label, active, danger, onClick, disabled }: MenuItemProps) {
  return (
    <li
      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl cursor-pointer text-xs sm:text-sm font-semibold transition-all select-none
        ${active ? "bg-primary text-primary-foreground shadow-xs" : ""}
        ${!active && !danger ? "hover:bg-muted text-foreground" : ""}
        ${danger ? "text-destructive hover:bg-destructive/10" : ""}
        ${disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`}
      onClick={disabled ? undefined : onClick}
    >
      {icon}
      <span>{label}</span>
    </li>
  );
}

const DeleteButton = memo(function DeleteButton({ 
  homeworkId, 
  homeworkData 
}: { 
  homeworkId: number; 
  homeworkData: Homework; 
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài tập "${homeworkData.title}" không?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await homeworkService.deleteHomework(homeworkId);
      toast.success("Đã xóa bài tập thành công!");
      router.refresh();
    } catch (error) {
      console.error("Error deleting homework:", error);
      toast.error("Có lỗi xảy ra khi xóa bài tập");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <li 
      onClick={handleDelete}
      className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer transition-colors"
    >
      <Trash2 className="w-4 h-4" />
      <span>{isDeleting ? "Đang xóa..." : "Xóa bài tập"}</span>
    </li>
  );
});

/** =============== Utils =============== */
function formatDateTime(date: DateInput) {
  if (!date) return "Không";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return "Không";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
