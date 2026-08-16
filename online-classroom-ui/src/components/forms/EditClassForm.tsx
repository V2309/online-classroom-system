"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { classService } from "@/services/class.service";
import GradeSelection from "@/components/GradeSelection";
import ImageUpload from "@/components/ImageUpload";
import ClassDeleteActions from "@/components/ClassDeleteActions";
import { Settings, Shield, Lock, UserCheck, LogOut, FileText, CheckCircle2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface Grade {
  id: number;
  level: string;
}

interface EditClassFormProps {
  classEdit: {
    id: number;
    name: string;
    img?: string | null;
    gradeId?: number;
    grade?: { level: string } | null;
    isProtected?: boolean;
    isLocked?: boolean;
    requiresApproval?: boolean;
    blockLeave?: boolean;
    allowGradesView?: boolean;
  };
  grades: Grade[];
  classCode: string;
}

// Component cho các công tắc chuyển đổi (toggle switch)
const ToggleSwitch = ({
  label,
  description,
  checked,
  onChange,
  icon: Icon,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <div className="flex items-center justify-between py-4 border-b border-border/60 last:border-b-0 gap-4">
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0 mt-0.5 text-muted-foreground">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="flex flex-col">
        <span className="font-bold text-foreground text-sm sm:text-base cursor-pointer">
          {label}
        </span>
        {description && (
          <p className="text-xs sm:text-sm text-secondary max-w-lg mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 select-none">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-2xs"></div>
    </label>
  </div>
);

export default function EditClassForm({ classEdit, grades, classCode }: EditClassFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState(classEdit.name || "");
  const [img, setImg] = useState<string>(classEdit.img || "");
  const [gradeId, setGradeId] = useState<number | undefined>(classEdit.gradeId);
  const [newGradeLevel, setNewGradeLevel] = useState<string | undefined>();

  // Toggle Switches State
  const [isProtected, setIsProtected] = useState(classEdit.isProtected || false);
  const [isLocked, setIsLocked] = useState(classEdit.isLocked || false);
  const [requiresApproval, setRequiresApproval] = useState(classEdit.requiresApproval || false);
  const [blockLeave, setBlockLeave] = useState(classEdit.blockLeave || false);
  const [allowGradesView, setAllowGradesView] = useState(classEdit.allowGradesView || false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên lớp học");
      return;
    }

    setIsSubmitting(true);
    try {
      await classService.updateClass(classEdit.id, {
        name: name.trim(),
        img: img || undefined,
        gradeId,
        newGradeLevel: newGradeLevel || undefined,
        isProtected,
        isLocked,
        requiresApproval,
        blockLeave,
        allowGradesView,
      });

      toast.success("Cập nhật lớp học thành công!");
      router.push(`/class/${classCode}/newsfeed`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật lớp học");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href={`/class/${classCode}/newsfeed`}
            className="w-9 h-9 rounded-2xl bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-2xs"
            title="Quay lại lớp học"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" />
              <span>Cài đặt & Chỉnh sửa lớp học</span>
            </h1>
            <p className="text-xs sm:text-sm text-secondary">
              Mã lớp: <span className="font-mono font-bold text-foreground">{classCode}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Cột chính (bên trái) */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-border shadow-sm text-foreground">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tên lớp học */}
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-foreground mb-2">
                Tên lớp học <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-card text-foreground border border-border rounded-2xl px-4 py-3 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none"
                placeholder="Ví dụ: Lớp 10A1 - Toán"
                required
              />
            </div>

            {/* Ảnh bìa */}
            <div className="pt-2">
              <ImageUpload
                currentImage={img}
                classCode={classCode}
                onImageUploaded={setImg}
              />
            </div>

            {/* Khối lớp */}
            <div className="pt-2 border-t border-border/60">
              <GradeSelection
                grades={grades}
                currentGradeId={classEdit.gradeId || 0}
                currentGradeLevel={classEdit.grade?.level || "Chưa cập nhật"}
                onGradeSelect={(selectedGId, newGLevel) => {
                  setGradeId(selectedGId);
                  setNewGradeLevel(newGLevel);
                }}
              />
            </div>

            {/* Các tùy chọn cài đặt bảo mật & quyền hạn */}
            <div className="pt-4 border-t border-border/60 space-y-1">
              <h3 className="font-heading font-bold text-base text-foreground mb-3">
                Quyền hạn & Bảo mật lớp học
              </h3>
              
              <ToggleSwitch
                label="Mã bảo vệ lớp học"
                description="Yêu cầu nhập mật mã khi học sinh tham gia lớp"
                icon={Shield}
                checked={isProtected}
                onChange={setIsProtected}
              />
              <ToggleSwitch
                label="Khóa lớp học"
                description="Không cho phép học sinh mới tham gia qua mã lớp hoặc link"
                icon={Lock}
                checked={isLocked}
                onChange={setIsLocked}
              />
              <ToggleSwitch
                label="Phê duyệt học sinh"
                description="Yêu cầu giáo viên xét duyệt học sinh trước khi được vào lớp học"
                icon={UserCheck}
                checked={requiresApproval}
                onChange={setRequiresApproval}
              />
              <ToggleSwitch
                label="Chặn học sinh tự rời lớp học"
                description="Học sinh không thể tự bấm rời lớp mà phải do giáo viên xóa khỏi danh sách"
                icon={LogOut}
                checked={blockLeave}
                onChange={setBlockLeave}
              />
              <ToggleSwitch
                label="Cho phép học sinh xem bảng điểm"
                description="Hiển thị bảng điểm tổng kết và xếp hạng cho toàn thể học sinh trong lớp"
                icon={FileText}
                checked={allowGradesView}
                onChange={setAllowGradesView}
              />
            </div>

            {/* Nút submit */}
            <div className="pt-6 border-t border-border/60">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-2xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 text-sm sm:text-base cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang lưu thay đổi...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Cột phụ (bên phải) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Hướng dẫn sử dụng */}
          <div className="bg-white rounded-3xl border border-border shadow-sm p-6 text-foreground space-y-3">
            <h4 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
              <span className="text-primary">💡</span> Hướng dẫn sử dụng
            </h4>
            <ul className="text-xs sm:text-sm text-secondary space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <span>Chọn <b>Khác</b> trong danh mục khối để tạo khối lớp mới tự động.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <span>Bật <b>Phê duyệt học sinh</b> để kiểm soát danh sách thành viên an toàn.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <span>Bấm <b>Lưu thay đổi</b> sau khi hoàn tất chỉnh sửa.</span>
              </li>
            </ul>
          </div>

          {/* Vùng nguy hiểm: Xóa lớp học */}
          <div className="bg-white rounded-3xl border border-destructive/20 shadow-sm p-6 text-foreground space-y-3">
            <h4 className="font-heading font-bold text-base text-destructive flex items-center gap-2">
              ⚠️ Vùng nguy hiểm
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Khi xóa lớp học, lớp sẽ được chuyển vào thùng rác và có thể khôi phục lại sau nếu cần.
            </p>
            <div className="pt-2">
              <ClassDeleteActions
                classId={classEdit.id}
                isDeleted={false}
                className="w-full border border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10 font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
