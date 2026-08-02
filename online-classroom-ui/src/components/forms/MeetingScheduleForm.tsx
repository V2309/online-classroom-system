"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Dispatch, SetStateAction, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Clock, Calendar, Users, Video, Copy, Check } from "lucide-react";
import moment from "moment";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { createMeetingSchedule } from "@/lib/actions/schedule.action";
import { MeetingScheduleSchema, meetingScheduleSchema } from "@/lib/formValidationSchema";
import { useUser } from "@/hooks/useUser";

// Định nghĩa kiểu dữ liệu cho class
interface ClassData {
  id: string;
  name: string;
  img: string;
  class_code: string;
  studentCount: number;
  color: string;
}

interface MeetingScheduleFormProps {
  type: "create";
  selectedDate?: Date;
  classId?: number;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onSuccess?: () => void;
  teacherClasses?: ClassData[];
}

const MeetingScheduleForm = ({ 
  type, 
  selectedDate, 
  classId, 
  setOpen, 
  onSuccess,
  teacherClasses = []
}: MeetingScheduleFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(classId ? 2 : 1);
  const [selectedClassData, setSelectedClassData] = useState<ClassData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [meetingCreated, setMeetingCreated] = useState<{
    meetingId: string;
    meetingLink: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const client = useStreamVideoClient();
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    clearErrors,
  } = useForm<MeetingScheduleSchema>({
    defaultValues: {
      title: "",
      description: "",
      classId: classId || 0,
      date: selectedDate ? moment(selectedDate).format("YYYY-MM-DD") : "",
      startTime: "07:00",
      endTime: "08:30",
      isMeeting: true,
      recurrenceType: "NONE",
      interval: 1,
      recurrenceEnd: null,
      weekDays: [],
      maxOccurrences: null,
    },
  });

  const recurrenceType = watch("recurrenceType");
  const weekDaysValue = watch("weekDays") || [];

  // Tìm class được chọn nếu có classId
  useEffect(() => {
    if (classId && teacherClasses.length > 0) {
      const foundClass = teacherClasses.find(cls => Number(cls.id) === classId);
      if (foundClass) {
        setSelectedClassData(foundClass);
        setValue("classId", classId);
      }
    }
  }, [classId, teacherClasses, setValue]);

  // Filter classes cho search
  const filteredClasses = teacherClasses.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.class_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClassSelect = (cls: ClassData) => {
    setSelectedClassData(cls);
    setValue("classId", Number(cls.id));
    setCurrentStep(2);
    clearErrors("classId");
  };

  const copyMeetingLink = useCallback(async () => {
    if (meetingCreated?.meetingLink) {
      try {
        await navigator.clipboard.writeText(meetingCreated.meetingLink);
        setCopied(true);
        toast.success("Đã sao chép link cuộc họp!");
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error("Không thể sao chép link");
      }
    }
  }, [meetingCreated?.meetingLink]);

  const onSubmit = handleSubmit(async (formData) => {
    if (!client || !user) {
      toast.error("Chưa kết nối được với dịch vụ cuộc họp");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Tạo meeting call trên Stream
      const meetingId = crypto.randomUUID();
      const call = client.call('default', meetingId);
      
      if (!call) {
        throw new Error('Không thể tạo cuộc họp');
      }

      const startDateTime = moment(`${formData.date} ${formData.startTime}`, "YYYY-MM-DD HH:mm").toDate();
      
      await call.getOrCreate({
        data: {
          starts_at: startDateTime.toISOString(),
          custom: {
            description: formData.description || formData.title,
            title: formData.title,
            classCode: selectedClassData?.class_code,
          },
        },
      });

      const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meetingId}`;

      // 2. Tạo lịch trong database
      const result = await createMeetingSchedule(
        { success: false, error: false },
        {
          ...formData,
          meetingId,
          meetingLink,
          isMeeting: true,
        }
      );

      if (result?.success) {
        setMeetingCreated({ meetingId, meetingLink });
        toast.success("Tạo lịch cuộc họp thành công!");
        onSuccess?.();
      } else {
        toast.error(result?.message || "Có lỗi xảy ra khi tạo lịch");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Có lỗi xảy ra khi tạo cuộc họp");
    } finally {
      setIsLoading(false);
    }
  });

  const formVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        variants={formVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-blue-600 text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            {currentStep === 2 && !classId && (
              <button
                onClick={() => setCurrentStep(1)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <Video className="w-6 h-6" />
            <h2 className="text-xl font-semibold">
              Tạo lịch cuộc họp
              {!classId && (currentStep === 1 ? " - Chọn lớp" : " - Thông tin cuộc họp")}
            </h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {!meetingCreated ? (
              <>
                {/* Step 1: Chọn lớp học */}
                {currentStep === 1 && !classId && (
                  <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Tìm kiếm lớp học..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>

                    {/* Classes Grid */}
                    <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {filteredClasses.map((cls) => (
                        <div
                          key={cls.id}
                          onClick={() => handleClassSelect(cls)}
                          className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                              style={{ backgroundColor: cls.color }}
                            >
                            <Image
                              src={cls.img}
                              alt={cls.name}
                              width={40}
                              height={40}
                              className="rounded-lg"
                            />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 group-hover:text-blue-700">
                                {cls.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Mã lớp: {cls.class_code} • {cls.studentCount} học sinh
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {errors.classId && (
                      <p className="text-sm text-red-500 mt-2">{errors.classId.message}</p>
                    )}
                  </div>
                )}

                {/* Step 2: Form thông tin cuộc họp */}
                {currentStep === 2 && (
                  <form onSubmit={onSubmit} className="space-y-6">
                    {/* Selected Class Info */}
                    {selectedClassData && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                            style={{ backgroundColor: selectedClassData.color }}
                          >
                              <Image
                              src={selectedClassData.img}
                              alt={selectedClassData.name}
                              width={40}
                              height={40}
                              className="rounded-lg"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{selectedClassData.name}</p>
                            <p className="text-sm text-gray-600">
                              Mã lớp: {selectedClassData.class_code} • {selectedClassData.studentCount} học sinh
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Meeting Title */}
                    <div className="space-y-1">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        <Video className="w-4 h-4 inline mr-1" />
                        Tên cuộc họp *
                      </label>
                      <input
                        type="text"
                        id="title"
                        {...register("title", { required: "Tên cuộc họp là bắt buộc!" })}
                        className="block w-full rounded-lg border border-gray-300 shadow-sm p-3 text-sm text-gray-900
                                  focus:border-purple-500 focus:ring-purple-500 transition duration-200
                                  hover:border-gray-400"
                        placeholder="Ví dụ: Họp phụ huynh lớp 10A1"
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
                        className="block w-full rounded-lg border border-gray-300 shadow-sm p-3 text-sm text-gray-900
                                  focus:border-purple-500 focus:ring-purple-500 transition duration-200
                                  hover:border-gray-400 resize-none"
                        placeholder="Mô tả nội dung cuộc họp..."
                      />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 gap-4">
                      {/* Date */}
                      <div className="space-y-1">
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Ngày họp *
                        </label>
                        <input
                          type="date"
                          id="date"
                          {...register("date", { required: "Vui lòng chọn ngày họp!" })}
                          className="block w-full rounded-lg border border-gray-300 shadow-sm p-3 text-sm text-gray-900
                                    focus:border-purple-500 focus:ring-purple-500 transition duration-200
                                    hover:border-gray-400"
                        />
                        {errors.date && (
                          <p className="text-xs text-red-500">{errors.date.message}</p>
                        )}
                      </div>

                      {/* Time Range */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Bắt đầu *
                          </label>
                          <input
                            type="time"
                            id="startTime"
                            {...register("startTime", { required: "Vui lòng chọn thời gian bắt đầu!" })}
                            className="block w-full rounded-lg border border-gray-300 shadow-sm p-3 text-sm text-gray-900
                                      focus:border-purple-500 focus:ring-purple-500 transition duration-200
                                      hover:border-gray-400"
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
                            {...register("endTime", { required: "Vui lòng chọn thời gian kết thúc!" })}
                            className="block w-full rounded-lg border border-gray-300 shadow-sm p-3 text-sm text-gray-900
                                      focus:border-purple-500 focus:ring-purple-500 transition duration-200
                                      hover:border-gray-400"
                          />
                          {errors.endTime && (
                            <p className="text-xs text-red-500">{errors.endTime.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recurrence options */}
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Lặp lại</label>
                        <select
                          {...register("recurrenceType")}
                          className="block w-full rounded-lg border border-gray-300 shadow-sm p-3 text-sm text-gray-900
                                    focus:border-purple-500 focus:ring-purple-500"
                        >
                          <option value="NONE">Không lặp</option>
                          <option value="DAILY">Hàng ngày</option>
                          <option value="WEEKLY">Hàng tuần</option>
                          <option value="MONTHLY_BY_DATE">Hàng tháng</option>
                        </select>
                      </div>

                      {recurrenceType && recurrenceType !== "NONE" && (
                        <div className="grid grid-cols-1 gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Khoảng cách</label>
                            <input
                              type="number"
                              min={1}
                              {...register("interval", { valueAsNumber: true })}
                              className="block w-32 rounded-lg border border-gray-300 shadow-sm p-2 text-sm text-gray-900
                                        focus:border-purple-500 focus:ring-purple-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Kết thúc lặp lại (tùy chọn)</label>
                            <input
                              type="date"
                              {...register("recurrenceEnd")}
                              className="block w-full rounded-lg border border-gray-300 shadow-sm p-3 text-sm text-gray-900
                                        focus:border-purple-500 focus:ring-purple-500"
                            />
                          </div>

                          {(recurrenceType === "WEEKLY") && (
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
                                        const newWeekDays = checked 
                                          ? weekDaysValue.filter(d => d !== idx)
                                          : [...weekDaysValue, idx];
                                        setValue("weekDays", newWeekDays);
                                      }}
                                      className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                                        checked 
                                          ? "bg-purple-100 border-purple-500 text-purple-700" 
                                          : "bg-white border-gray-300 text-gray-700 hover:border-purple-300"
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
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 transition-all"
                      >
                        {isLoading ? "Đang tạo..." : "Tạo cuộc họp"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              /* Success Screen - Hiển thị meeting link */
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Cuộc họp đã được tạo thành công!
                  </h3>
                  <p className="text-gray-600">
                    Link cuộc họp đã được tạo và lưu vào lịch học
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Link tham gia cuộc họp:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={meetingCreated.meetingLink}
                      readOnly
                      className="flex-1 p-3 border border-gray-300 rounded-lg bg-white text-sm"
                    />
                    <button
                      onClick={copyMeetingLink}
                      className={`px-4 py-3 rounded-lg border transition-all ${
                        copied 
                          ? "bg-green-100 border-green-300 text-green-700" 
                          : "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={copyMeetingLink}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {copied ? "Đã sao chép" : "Sao chép link"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      </motion.div>
    </div>

  );
};

export default MeetingScheduleForm;