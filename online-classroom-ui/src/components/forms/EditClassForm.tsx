"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { classService } from "@/services/class.service";
import GradeSelection from "@/components/GradeSelection";
import ImageUpload from "@/components/ImageUpload";
import ClassDeleteActions from "@/components/ClassDeleteActions";

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
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-4 border-b last:border-b-0">
    <div className="flex flex-col">
      <span className="font-semibold text-gray-800 cursor-pointer">
        {label}
      </span>
      {description && (
        <p className="text-sm text-gray-500 max-w-md">{description}</p>
      )}
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  </div>
);

// Component cho các mục trong hộp trạng thái
const StatusStep = ({ text, linkText }: { text: string; linkText: string }) => (
  <li className="flex justify-between items-center mb-3">
    <div>
      <p className="font-medium text-gray-800">{text}</p>
      <p className="text-sm text-gray-500">
        Bắt buộc - <span className="text-blue-500">{linkText}</span>
      </p>
    </div>
    <svg
      className="w-6 h-6 text-green-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 13l4 4L19 7"
      ></path>
    </svg>
  </li>
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cột chính (bên trái) */}
      <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm">
        <form onSubmit={handleSubmit}>
          {/* Tên lớp học */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-gray-800 font-bold mb-2">
              Tên lớp học
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Ví dụ: Lớp 10A1 - Toán"
              required
            />
          </div>

          {/* Ảnh bìa */}
          <ImageUpload
            currentImage={img}
            classCode={classCode}
            onImageUploaded={setImg}
          />

          {/* Các tùy chọn cài đặt */}
          <ToggleSwitch
            label="Mã bảo vệ"
            checked={isProtected}
            onChange={setIsProtected}
          />
          <ToggleSwitch
            label="Khóa lớp học"
            checked={isLocked}
            onChange={setIsLocked}
          />
          <ToggleSwitch
            label="Phê duyệt học sinh"
            description="Phê duyệt học sinh tránh tình trạng người lạ vào lớp học mà không có sự cho phép của bạn"
            checked={requiresApproval}
            onChange={setRequiresApproval}
          />
          <ToggleSwitch
            label="Chặn học sinh tự rời lớp học"
            description="Tính năng này giúp giáo viên quản lý số lượng thành viên trong lớp tốt hơn tránh tình trạng học sinh tự ý thoát khỏi lớp"
            checked={blockLeave}
            onChange={setBlockLeave}
          />
          <ToggleSwitch
            label="Cho phép học sinh xem bảng điểm"
            checked={allowGradesView}
            onChange={setAllowGradesView}
          />

          {/* Khối lớp */}
          <GradeSelection
            grades={grades}
            currentGradeId={classEdit.gradeId || 0}
            currentGradeLevel={classEdit.grade?.level || "Chưa cập nhật"}
            onGradeSelect={(selectedGId, newGLevel) => {
              setGradeId(selectedGId);
              setNewGradeLevel(newGLevel);
            }}
          />

          {/* Nút submit */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>💾 Lưu lại</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Cột phụ (bên phải) */}
      <div className="lg:col-span-1 space-y-6">
        <div className="space-y-3">
          <ClassDeleteActions
            classId={classEdit.id}
            isDeleted={false}
            className="w-full border-2 border-red-200 text-red-500 bg-white font-bold py-3 px-4 rounded-lg hover:bg-red-50 hover:border-red-500 transition-colors flex items-center justify-center gap-2"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Hướng dẫn sử dụng</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>Chọn Khác để tạo khối mới</li>
            <li>Nhập tên khối và bấm Lưu lại</li>
            <li>Khối mới sẽ được tự động tạo</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-bold text-lg mb-4">Các bước đã thực hiện</h3>
          <ul>
            <StatusStep text="Đặt tên lớp học" linkText="Thêm ngay" />
            <StatusStep text="Thêm ảnh bìa lớp học" linkText="Thêm ngay" />
            <StatusStep text="Chọn môn học" linkText="Thêm ngay" />
            <StatusStep text="Chọn khối lớp" linkText="Thêm ngay" />
          </ul>
        </div>
      </div>
    </div>
  );
}
