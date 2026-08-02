
///src/components/forms/ScheduleForm.tsx
"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { Dispatch, SetStateAction, useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { X, Search, Clock, Calendar, Users } from "lucide-react";
import moment from "moment";
// import { getTeacherClasses } from "@/lib/actions/class.action"; // <-- ĐÃ XÓA
import { createSchedule, updateSchedule } from "@/lib/actions/schedule.action";
import { scheduleSchema, ScheduleSchema } from "@/lib/formValidationSchema";

// Sử dụng trực tiếp ScheduleSchema

// Định nghĩa kiểu dữ liệu cho rõ ràng
interface ClassData {
  id: string;
  name: string;
  img: string;
  class_code: string;
  studentCount: number;
  color: string;
}

interface ScheduleFormProps {
  type: "create" | "update";
  data?: {
    id: number;
    title: string;
    description?: string;
    classId: number;
    date: string;
    startTime: string;
    endTime: string;
    // Thêm recurrence fields để khớp với schema
    recurrenceType?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY_BY_DATE" | "CUSTOM";
    interval?: number;
    recurrenceEnd?: string | null;
    weekDays?: number[];
    maxOccurrences?: number | null;
  };
  selectedDate?: Date;
  classId?: number; // ID lớp học được chọn trước (khi đang ở trang lớp cụ thể)
  setOpen: Dispatch<SetStateAction<boolean>>;
  onSuccess?: () => void;
  onUpdateSubmit?: (formData: { title: string; description?: string }) => Promise<boolean>;
  
  // TỐI ƯU: Nhận danh sách lớp làm prop thay vì tự fetch
  teacherClasses: any[]; 
}

const ScheduleForm = ({ 
  type, 
  data, 
  selectedDate, 
  classId, 
  setOpen, 
  onSuccess,
  onUpdateSubmit,
  teacherClasses // <-- Nhận prop
}: ScheduleFormProps) => {

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(classId || type === "update" ? 2 : 1); // 1: Chọn lớp, 2: Nhập thông tin
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // TỐI ƯU: Khởi tạo `classes` từ prop, chỉ chạy 1 lần
  // Dữ liệu đã có sẵn, không cần `loadingClasses`
  const [classes] = useState<ClassData[]>(() => 
    teacherClasses.map((cls: any) => ({
      id: cls.id.toString(), // Giả định ID từ DB có thể là số, chuyển sang string
      name: cls.name,
      img: cls.img, 
      class_code: cls.class_code || "",
      studentCount: cls._count?.students || 0,
      color: cls.img || "#3B82F6", // Lấy img làm màu (theo code cũ), nếu không có thì default
    }))
  );
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<ScheduleSchema>({
    // Tạm thời bỏ resolver để tránh type conflict
    // resolver: zodResolver(scheduleSchema), 
    defaultValues: {
      title: data?.title || "",
      description: data?.description || "",
      classId: data?.classId || classId || 0, // Ưu tiên data?.classId, sau đó là classId prop
      date: selectedDate ? moment(selectedDate).format("YYYY-MM-DD") : data?.date || "",
      startTime: data?.startTime || "07:00",
      endTime: data?.endTime || "08:30",
      // recurrence defaults - bây giờ không cần cast as any
      recurrenceType: data?.recurrenceType || "NONE",
      interval: data?.interval || 1,
      recurrenceEnd: data?.recurrenceEnd || null,
      weekDays: data?.weekDays || [],
      maxOccurrences: data?.maxOccurrences || null,
    },
  });

  // Custom validation function using Zod schema (Optimized)
  const validateForm = useCallback((data: ScheduleSchema): boolean => {
    try {
      scheduleSchema.parse(data);
      clearErrors();
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          const path = err.path.join('.') as keyof ScheduleSchema;
          setError(path, {
            type: 'validation',
            message: err.message
          });
        });
      }
      return false;
    }
  }, [clearErrors, setError]);

  // TỐI ƯU: Đã xóa useEffect fetchClasses

  // Giữ lại useEffect này để tự động chọn lớp nếu `classId` được truyền vào
  useEffect(() => {
    if (classId) {
      // Tìm lớp trong danh sách đã có
      const preSelectedClass = classes.find(cls => cls.id === classId.toString());
      if (preSelectedClass) {
        setSelectedClass(preSelectedClass);
        setValue("classId", classId);
      }
    }
  }, [classId, classes, setValue]); // Chạy khi `classes` có sẵn

  // Lọc danh sách lớp (Optimized với useMemo)
  const filteredClasses = useMemo(() => 
    classes.filter(cls =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.class_code.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [classes, searchTerm]
  );

  // Watch recurrence fields
  const recurrenceType = watch("recurrenceType");
  const weekDaysValue: number[] = watch("weekDays") || [];

  const handleClassSelect = useCallback((classItem: ClassData) => {
    setSelectedClass(classItem);
    setValue("classId", parseInt(classItem.id)); // Giả định classId trong schema là number
  }, [setValue]);

  const handleNextStep = useCallback(() => {
    if (!selectedClass) {
      toast.error("Vui lòng chọn lớp học");
      return;
    }
    setCurrentStep(2);
  }, [selectedClass]);

  const handleBackStep = useCallback(() => {
    // Chỉ cho phép quay lại nếu form không bị ép buộc 1 lớp
    if (!classId) {
      setCurrentStep(1);
    }
  }, [classId]);

  const onSubmit = handleSubmit(async (formData) => {
    // Validate form data using custom validation
    if (!validateForm(formData)) {
      toast.error("Vui lòng kiểm tra lại thông tin form");
      return;
    }

    // Kiểm tra nếu là update và có onUpdateSubmit callback
    if (type === "update" && onUpdateSubmit) {
      const shouldContinue = await onUpdateSubmit({
        title: formData.title,
        description: formData.description
      });
      
      if (!shouldContinue) {
        // Callback đã handle việc submit, không cần tiếp tục
        return;
      }
    }

    setIsLoading(true);
    try {
      let result;
      
      if (type === "create") {
        result = await createSchedule({ success: false, error: false }, formData as ScheduleSchema);
      } else if (type === "update" && data?.id) {
        result = await updateSchedule(
          { success: false, error: false },
          { ...formData, id: data.id } as ScheduleSchema & { id: number }
        );
      }

      if (result?.success) {
        toast.success(result.message || (type === "create" ? "Tạo lịch học thành công!" : "Cập nhật lịch học thành công!"));
        setOpen(false);
        onSuccess?.(); // Gọi callback để refresh lịch
      } else {
        toast.error(result?.message || "Có lỗi xảy ra, vui lòng thử lại!");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  });

  const formVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        variants={formVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {/* Chỉ hiện nút back nếu đang ở bước 2 VÀ không bị ép buộc lớp (classId prop) VÀ không phải chế độ update */}
            {currentStep === 2 && !classId && type !== "update" && (
              <button
                onClick={handleBackStep}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {type === "create" ? "Tạo lịch học" : "Chỉnh sửa lịch học"}
              {/* Ẩn text "Chọn lớp" nếu đã có classId */}
              {!classId && (currentStep === 1 ? " - Chọn lớp" : " - Thông tin")}
            </h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress indicator (chỉ hiển thị nếu không bị ép buộc lớp và không phải chế độ update) */}
        {!classId && type !== "update" && (
          <div className="px-6 py-3 border-b bg-gray-50">
            <div className="flex items-center justify-center gap-4">
              <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium
                  ${currentStep >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                  1
                </div>
                <span className="text-sm font-medium">Chọn lớp</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium
                  ${currentStep >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                  2
                </div>
                <span className="text-sm font-medium">Thông tin</span>
              </div>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm lớp học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm
                            focus:border-blue-500 focus:ring-blue-500 transition duration-200"
                />
              </div>

              {/* Class list */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {/* TỐI ƯU: Đã xóa spinner loading */}
                {filteredClasses.length > 0 ? (
                  filteredClasses.map((classItem) => (
                    <div
                      key={classItem.id}
                      onClick={() => handleClassSelect(classItem)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md
                        ${selectedClass?.id === classItem.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Class avatar */}
                        <div 
                          className="w-12 h-12 rounded-lg flex-shrink-0"
                        >
                          <Image src={classItem.img} alt={classItem.name} width={32} height={32} className="rounded-lg object-cover" />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{classItem.name}</h3>
                          <p className="text-sm text-gray-500">Mã lớp: {classItem.class_code}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">{classItem.studentCount} học sinh</span>
                          </div>
                        </div>

                        {/* Selection indicator */}
                        {selectedClass?.id === classItem.id && (
                          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p>Không tìm thấy lớp học nào</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg 
                            hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!selectedClass}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg 
                            hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                  Tiếp theo
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <form onSubmit={onSubmit} className="space-y-5">
          

              {/* Selected class info (nếu có) */}
              {selectedClass && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded flex-shrink-0"
                    >
                      <Image src={selectedClass.img} alt={selectedClass.name} width={32} height={32} className="rounded object-cover" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">{selectedClass.name}</p>
                      <p className="text-sm text-blue-600">Mã lớp: {selectedClass.class_code}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule title */}
              <div className="space-y-1">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Tên buổi học 
                </label>
                <input
                  type="text"
                  id="title"
                  {...register("title")}
                  className="block w-full rounded-lg border border-gray-300 shadow-sm p-3 text-sm
                            focus:border-blue-500 focus:ring-blue-500 transition duration-200
                            hover:border-gray-400"
                  placeholder="Ví dụ: Môn Toán - Chương 1"
                />
                {errors.title && (
                  <p className="text-xs text-red-500">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Mô tả
                </label>
                <textarea
                  id="description"
                  {...register("description")}
                  rows={2}
                  className="block w-full rounded-lg border border-gray-300 shadow-sm p-3 text-sm
                            focus:border-blue-500 focus:ring-blue-500 transition duration-200
                            hover:border-gray-400 resize-none"
                  placeholder="Mô tả nội dung buổi học..."
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 gap-4">
                {/* Date */}
                <div className="space-y-1">
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Ngày học *
                  </label>
                  <input
                    type="date"
                    id="date"
                    {...register("date")}
                    disabled={type === "update"}
                    className={`block w-full rounded-lg border shadow-sm p-3 text-sm transition duration-200 ${
                      type === "update"
                        ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400"
                    }`}
                  />
                  {errors.date && (
                    <p className="text-xs text-red-500">{errors.date.message}</p>
                  )}
                </div>

                {/* Time range */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Bắt đầu *
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      {...register("startTime")}
                      disabled={type === "update"}
                      className={`block w-full rounded-lg border shadow-sm p-3 text-sm transition duration-200 ${
                        type === "update"
                          ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400"
                      }`}
                    />
                    {errors.startTime && (
                      <p className="text-xs text-red-500">{errors.startTime.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                      Kết thúc *
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      {...register("endTime")}
                      disabled={type === "update"}
                      className={`block w-full rounded-lg border shadow-sm p-3 text-sm transition duration-200 ${
                        type === "update"
                          ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400"
                      }`}
                    />
                    {errors.endTime && (
                      <p className="text-xs text-red-500">{errors.endTime.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recurrence options */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Lặp lại</label>
                <select
                  {...register("recurrenceType")}
                  disabled={type === "update"}
                  className={`block w-full rounded-lg border shadow-sm p-3 text-sm ${
                    type === "update"
                      ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                >
                  <option value="NONE">Không lặp</option>
                  <option value="DAILY">Hàng ngày</option>
                  <option value="WEEKLY">Hàng tuần</option>
                  <option value="MONTHLY_BY_DATE">Hàng tháng (ngày)</option>
                  <option value="CUSTOM">Tùy chỉnh</option>
                </select>
                {type === "update" && (
                  <p className="text-xs text-gray-500 italic">
                    Không thể thay đổi cài đặt lặp lại khi chỉnh sửa sự kiện
                  </p>
                )}
              </div>

              {recurrenceType && recurrenceType !== "NONE" && (
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Khoảng cách (interval)</label>
                    <input
                      type="number"
                      min={1}
                      {...register("interval", { valueAsNumber: true })}
                      disabled={type === "update"}
                      className={`block w-32 rounded-lg border shadow-sm p-2 text-sm ${
                        type === "update"
                          ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Kết thúc lặp lại (tùy chọn)</label>
                    <input
                      type="date"
                      {...register("recurrenceEnd")}
                      disabled={type === "update"}
                      className={`block w-full rounded-lg border shadow-sm p-3 text-sm ${
                        type === "update"
                          ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Số lần tối đa (tùy chọn)</label>
                    <input
                      type="number"
                      min={1}
                      {...register("maxOccurrences", { valueAsNumber: true })}
                      disabled={type === "update"}
                      className={`block w-32 rounded-lg border shadow-sm p-2 text-sm ${
                        type === "update"
                          ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    />
                  </div>

                  {(recurrenceType === "WEEKLY" || recurrenceType === "CUSTOM") && (
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Ngày trong tuần</label>
                      <div className="flex flex-wrap gap-2">
                        {['CN','T2','T3','T4','T5','T6','T7'].map((label, idx) => {
                          const checked = weekDaysValue.includes(idx);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (type === "update") return; // Không cho phép thay đổi khi update
                                const copy = new Set(weekDaysValue);
                                if (copy.has(idx)) copy.delete(idx);
                                else copy.add(idx);
                                setValue('weekDays', Array.from(copy));
                              }}
                              disabled={type === "update"}
                              className={`px-2 py-1 rounded-md border transition-colors ${
                                type === "update"
                                  ? "cursor-not-allowed opacity-50"
                                  : "cursor-pointer"
                              } ${
                                checked 
                                  ? 'bg-blue-600 text-white border-blue-600' 
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hidden fields */}
              <input type="hidden" {...register("classId")} />

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t">
                {/* Chỉ hiện nút back nếu không bị ép buộc lớp và không phải chế độ update */}
                {!classId && type !== "update" && (
                  <button
                    type="button"
                    onClick={handleBackStep}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg 
                              hover:bg-gray-200 transition-colors"
                  >
                    Quay lại
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg 
                            hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading 
                    ? (type === "create" ? "Đang tạo..." : "Đang cập nhật...") 
                    : (type === "create" ? "Tạo lịch học" : "Cập nhật")
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ScheduleForm;