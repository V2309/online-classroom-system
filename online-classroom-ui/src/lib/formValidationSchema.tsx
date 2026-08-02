import { z } from "zod";

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  teachers: z.array(z.string()), //teacher ids
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "name is required!" }),
  capacity: z.coerce.number().min(1, { message: "Capacity is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade name is required!" }),
  supervisorId: z.coerce.string().optional(),
});

export type ClassSchema = z.infer<typeof classSchema>;


export const scheduleSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Tên buổi học là bắt buộc!" }),
  description: z.string().optional(),
  classId: z.coerce.number().min(1, { message: "Vui lòng chọn lớp học!" }),
  date: z.string().min(1, { message: "Vui lòng chọn ngày học!" }),
  startTime: z.string().min(1, { message: "Vui lòng chọn thời gian bắt đầu!" }),
  endTime: z.string().min(1, { message: "Vui lòng chọn thời gian kết thúc!" }),
  // Recurrence options - không dùng optional() để tránh lỗi TypeScript
  recurrenceType: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY_BY_DATE", "CUSTOM"]).default("NONE"),
  interval: z.coerce.number().min(1).default(1),
  recurrenceEnd: z.string().nullable().optional(),
  weekDays: z.array(z.coerce.number()).default([]),
  maxOccurrences: z.coerce.number().nullable().optional(),
});

export type ScheduleSchema = z.infer<typeof scheduleSchema>;

// Schema cho Meeting Schedule (kế thừa từ ScheduleSchema và thêm meeting fields)
export const meetingScheduleSchema = scheduleSchema.extend({
  isMeeting: z.boolean().default(true),
  meetingId: z.string().optional(),
  meetingLink: z.string().optional(),
});

export type MeetingScheduleSchema = z.infer<typeof meetingScheduleSchema>;

export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title name is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
});

export type ExamSchema = z.infer<typeof examSchema>;


export const homeworkSchema = z.object({
  title: z.string().min(1, "Tên bài tập là bắt buộc"),
  description: z.string().optional(),
  content: z.string().optional(),
  startTime: z.string().min(1, "Thời gian bắt đầu là bắt buộc"),
  endTime: z.string().min(1, "Hạn chót nộp bài là bắt buộc"),
  duration: z.number()
    .min(1, "Thời lượng làm bài phải ít nhất 1 phút")
    .max(600, "Thời lượng làm bài không được vượt quá 600 phút"),
  maxAttempts: z.number()
    .min(1, "Số lần làm bài phải ít nhất 1 lần")
    .max(10, "Số lần làm bài không được vượt quá 10 lần")
    .optional().or(z.literal('')),
  points: z.number()
    .min(1, "Tổng điểm phải ít nhất 1 điểm")
    .max(1000, "Tổng điểm không được vượt quá 1000 điểm")
    .optional(),
  numQuestions: z.number()
    .min(1, "Số lượng câu hỏi phải ít nhất 1 câu")
    .optional(),
  subjectId: z.string().optional(),
  classCode: z.string().min(1, "Yêu cầu chọn lớp học"),
}).refine((data) => {
  const startDate = new Date(data.startTime);
  const endDate = new Date(data.endTime);
  const now = new Date();
  
  // Kiểm tra thời gian bắt đầu phải lớn hơn thời gian hiện tại
  if (startDate <= now) {
    return false;
  }
  
  // Kiểm tra thời gian bắt đầu phải nhỏ hơn thời gian kết thúc
  if (startDate >= endDate) {
    return false;
  }
  
  return true;
}, {
  message: "Thời gian bắt đầu phải sau thời điểm hiện tại và trước thời gian kết thúc",
  path: ["startTime"],
}).refine((data) => {
  const startDate = new Date(data.startTime);
  const endDate = new Date(data.endTime);
  
  // Kiểm tra thời gian kết thúc phải lớn hơn thời gian bắt đầu
  if (endDate <= startDate) {
    return false;
  }
  
  return true;
}, {
  message: "Hạn chót nộp bài phải sau thời gian bắt đầu",
  path: ["endTime"],
});

export type HomeworkSchema = z.infer<typeof homeworkSchema>;

// validation schema cho form đăng ký


export const signupSchema = z.object({
  username: z.string().min(3, { message: "Tên người dùng phải có ít nhất 3 ký tự!" }).max(50, { message: "Tên người dùng không được quá 50 ký tự!" }),
  class_name: z.string().min(1, { message: "Lớp học là bắt buộc!" }),
  school: z.string().min(1, { message: "Tên trường là bắt buộc!" }),
  birthday: z.string().min(1, { message: "Ngày sinh là bắt buộc!" }),
  province: z.string().min(1, { message: "Tỉnh/Thành phố là bắt buộc!" }),
  info: z.string().min(1, { message: "Email hoặc số điện thoại là bắt buộc!" })
    .refine((val) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[0-9]{10,11}$/;
      return emailRegex.test(val) || phoneRegex.test(val);
    }, { message: "Vui lòng nhập email hợp lệ hoặc số điện thoại (10-11 chữ số)!" }),
  role: z.enum(["student", "teacher"], { message: "Vui lòng chọn vai trò!" }),
  password: z.string().min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự!" }),
  "confirm-password": z.string().min(1, { message: "Vui lòng xác nhận mật khẩu!" }),
  terms: z.boolean().refine((v) => v === true, { message: "Bạn phải đồng ý với điều khoản dịch vụ!" }),
}).refine((data) => data.password === data["confirm-password"], {
  message: "Mật khẩu xác nhận không khớp!",
  path: ["confirm-password"],
});

export type SignupSchema = z.infer<typeof signupSchema>;

// Course Schema  
export const courseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, { message: "Tiêu đề khóa học là bắt buộc!" }),
  description: z.string().optional().default(""),
  thumbnailUrl: z.string().optional().default(""), // Tự động tạo từ video YouTube
  folderId: z.string().optional().nullable(),
  classCode: z.string().min(1, { message: "Mã lớp học là bắt buộc!" }),
  chapters: z.string().optional().default("[]"),
  // Fields cho folder mới (tùy chọn)
  newFolderName: z.string().optional().default(""),
  newFolderDescription: z.string().optional().default(""),
  newFolderColor: z.string().optional().default("#3B82F6"),
});

export type CourseSchema = z.infer<typeof courseSchema>;

// Folder Schema
export const folderSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tên thư mục không được để trống"),
  description: z.string().nullable().optional(),
  color: z.string().optional(),
  classCode: z.string().min(1),
});

export type FolderSchema = z.infer<typeof folderSchema>;

// Change Password Schema
export const changePasswordSchema = z.object({
  newPassword: z.string().min(8, { message: "Mật khẩu mới phải có ít nhất 8 ký tự!" }),
  confirmPassword: z.string().min(1, { message: "Vui lòng xác nhận mật khẩu!" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp!",
  path: ["confirmPassword"],
});

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;