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
import FormModal from "@/components/FormModal";
import { memo } from "react";

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
          const response = await fetch(
            `/api/homework/submissions/count?homeworkId=${homework.id}`
          );
          const data = await response.json();
          if (data.success) {
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
    console.log("DEBUG handleViewDetail:", { role, classCode, homeworkId: homework.id });
    if (!classCode) return toast.error("Không tìm thấy mã lớp!");
    
    if (role === "teacher") {
      // Giáo viên xem danh sách học sinh và chấm bài
      const url = `/class/${classCode}/homework/${homework.id}/teacher-detail`;
      console.log("Navigating to:", url);
      router.push(url);
    } else {
      // Học sinh xem kết quả bài làm
      if (bestSubmissionId) {
        // utid = submission ID (ID của bài làm cụ thể)
        router.push(
          `/class/${classCode}/homework/${homework.id}/detail?utid=${bestSubmissionId}`
        );
      } else {
        // Lấy bài làm có điểm cao nhất của student
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
      
      const response = await fetch(`/api/homework/${homework.id}/download`);
      const data = await response.json();
      
      if (data.success && data.fileUrl) {
        // Tạo link download
        const link = document.createElement('a');
        link.href = data.fileUrl;
        
        // Tạo tên file từ title homework nếu không có originalFileName
        const fileName = data.fileName || `${homework.title.replace(/[^a-zA-Z0-9\s]/g, '')}.pdf`;
        link.download = fileName;
        
        // Mở trong tab mới để đảm bảo download được
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Đã tải file: ${fileName}`);
      } else {
        toast.error(data.error || "Không tìm thấy file để tải về");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Có lỗi xảy ra khi tải file");
    }
  };



  // trạng thái bài tập (student)
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
        message: `Bài tập chưa bắt đầu còn ${hours > 0 ? `${hours} giờ ` : ""
          }${minutes} phút nữa mới bắt đầu`,
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
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-2">{homework.title}</h2>

      {homework.description && (
        <div className="mb-2 text-gray-700">{homework.description}</div>
      )}

      {/* trạng thái (student) */}
      {role === "student" && homeworkStatus && (
        <div
          className={`p-3 rounded-lg border ${homeworkStatus.type === "available"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-yellow-50 border-yellow-200 text-yellow-800"
            }`}
        >
          <div className="flex items-center gap-2">
            {homeworkStatus.type === "available" ? (
              <Clock size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span className="font-medium">{homeworkStatus.message}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoItem label="Tổng điểm" value={homework.points ? (Math.round(homework.points * 100) / 100).toString() : "Không"} />
        <InfoItem label="Thời gian bắt đầu" value={formatDateTime(homework.startTime)} />
        <InfoItem label="Hạn chót nộp bài" value={formatDateTime(homework.endTime)} />
        <InfoItem
          label="Thời lượng"
          value={homework.duration ? `${homework.duration} phút` : "Không"}
        />
        <InfoItem
          label="Số lần làm bài tối đa"
          value={homework.maxAttempts?.toString() || "Không"}
        />
        <InfoItem label="Ngày tạo" value={formatDateTime(homework.createdAt)} />


        <InfoItem
          label="Điểm"
          value={
            homework.gradingMethod === 'FIRST_ATTEMPT' ? 'Lấy điểm lần đầu tiên' :
              homework.gradingMethod === 'LATEST_ATTEMPT' ? 'Lấy điểm lần mới nhất' :
                homework.gradingMethod === 'HIGHEST_ATTEMPT' ? 'Lấy điểm cao nhất' :
                  'Lấy điểm lần đầu tiên'
          }
        />
        <InfoItem
          label="Cho phép"
          value={
            homework.studentViewPermission === 'NO_VIEW' ? 'Không được xem điểm' :
              homework.studentViewPermission === 'SCORE_ONLY' ? 'Chỉ xem điểm tổng' :
                homework.studentViewPermission === 'SCORE_AND_RESULT' ? 'Xem điểm và chi tiết' :
                  'Không xác định'
          }
        />
        <InfoItem
          label="Chặn xem lại đề"
          value={homework.blockViewAfterSubmit ? 'Có' : 'Không'}
        />



        {role === "student" && (() => {
          // Kiểm tra xem bài tập đã hết hạn chưa
          const isExpired = homework.endTime ? new Date() > new Date(homework.endTime) : false;
          const canViewScore = homework.studentViewPermission !== 'NO_VIEW';
          const shouldShowScore = canViewScore || isExpired;

          return (
            <>
              <InfoItem
                label="Số lần đã làm"
                value={`${submissionCount}/${homework.maxAttempts || 1}`}
              />
              {/* Hiển thị điểm theo phương pháp đã cấu hình khi có quyền xem hoặc đã hết hạn */}
              {shouldShowScore && currentGrade !== null && (
                <InfoItem
                  label={
                    homework.gradingMethod === 'FIRST_ATTEMPT' ? 'Điểm lần đầu tiên' :
                      homework.gradingMethod === 'LATEST_ATTEMPT' ? 'Điểm lần mới nhất' :
                        homework.gradingMethod === 'HIGHEST_ATTEMPT' ? 'Điểm cao nhất' :
                          'Điểm hiện tại'
                  }
                  value={`${Math.round(currentGrade * 100) / 100}/${Math.round((homework.points || 10) * 100) / 100} điểm`}
                />
              )}
              {/* Hiển thị thông báo khi không có quyền xem điểm và chưa hết hạn */}
              {!shouldShowScore && (
                <InfoItem
                  label="Điểm"
                  value={isExpired ? "Đang được chấm" : "Sẽ có sau hết hạn làm bài"}
                />
              )}
            </>
          );
        })()}
      </div>

      {/* menu chức năng */}
      <div className="mt-6 border-t pt-4">
        <ul className="space-y-2">
          {role === "teacher" ? (
            <>
              <MenuItem icon={<MonitorPlay size={18} />} onClick={handlePractice} label="Làm thử" />
              <MenuItem icon={<Info size={18} />} onClick={handleViewDetail} label="Chi tiết" active />

              <MenuItem icon={<Pencil size={18} />} onClick={handleViewEdit} label="Chỉnh sửa" />
              <MenuItem
                icon={<Printer size={18} />}
                label="Xuất dữ liệu"
                onClick={() => setShowExport(true)}
              />
              <MenuItem 
                icon={<Download size={18} />} 
                label="Tải về" 
                onClick={handleDownload}
              />
              <DeleteButton homeworkId={homework.id} homeworkData={homework} />
            </>
          ) : role === "student" ? (
            <>
              <MenuItem
                icon={<Eye size={18} />}
                onClick={homeworkStatus?.canTake ? handlePractice : undefined}
                label="Làm bài"
                disabled={!homeworkStatus?.canTake}
              />
              {submissionCount > 0 && (
                <MenuItem icon={<Info size={18} />} onClick={handleViewDetail} label="Chi tiết" active />
              )}
            </>
          ) : null}
        </ul>
      </div>

      {/* modal export */}
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
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="font-medium">{value}</div>
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
      className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer
        ${active ? "bg-blue-50 text-blue-600 font-semibold" : ""}
        ${danger ? "text-red-600 hover:bg-red-50" : "hover:bg-gray-100"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={disabled ? undefined : onClick}
    >
      {icon}
      <span>{label}</span>
    </li>
  );
}

// Component DeleteButton được memoized để tránh re-render liên tục  
const DeleteButton = memo(function DeleteButton({ 
  homeworkId, 
  homeworkData 
}: { 
  homeworkId: number; 
  homeworkData: Homework; 
}) {
  return (
    <div className="flex items-center gap-2 py-1 rounded text-red-600 hover:bg-red-50 cursor-pointer">
      <FormModal table="homework" type="delete" id={homeworkId} data={homeworkData} />
    </div>
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
