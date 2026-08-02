"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormRegister, FieldError } from "react-hook-form";
import InputField from "../InputField"; // Giữ nguyên InputField của bạn
import { classSchema, ClassSchema } from "@/lib/formValidationSchema";
import { createClass, updateClass } from "@/lib/actions/class.action";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion"; // 1. Import motion

// Định nghĩa props cho SelectField tái sử dụng
type SelectFieldProps = {
  label: string;
  name: keyof ClassSchema; // Đảm bảo name là key của schema
  register: UseFormRegister<ClassSchema>;
  error?: FieldError;
  options: { value: string | number; label: string | number }[];
  defaultValue?: any;
};

// 2. Component SelectField để tái sử dụng, giúp code gọn gàng
const SelectField = ({
  label,
  name,
  register,
  error,
  options,
  defaultValue,
}: SelectFieldProps) => (
  <div className="w-full">
    <label
      htmlFor={name}
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      {label}
    </label>
    <select
      id={name}
      className="block w-full rounded-lg border border-gray-300 shadow-sm p-2.5 text-sm
                 focus:border-blue-500 focus:ring-blue-500 transition duration-150"
      {...register(name)}
      defaultValue={defaultValue}
    >
      {options.map((option) => (
        <option value={option.value} key={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error?.message && (
      <p className="mt-1 text-xs text-red-500">{error.message.toString()}</p>
    )}
  </div>
);

const ClassForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassSchema>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      // Set default values để form hoạt động tốt hơn với RHF
      name: data?.name || "",
      capacity: data?.capacity || 50,
      id: data?.id || undefined,
      supervisorId: data?.supervisorId || undefined,
      gradeId: data?.gradeId || undefined,
    },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createClass : updateClass,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Lớp học đã được tạo mới thành công!`);
      setOpen(false);
      router.refresh();
    }
    // Bạn cũng có thể thêm toast.error nếu state.error là một tin nhắn
    if (state.error && typeof state.error === "string") {
       toast.error(state.error);
    }
  }, [state, router, type, setOpen]);

  const { teachers, grades } = relatedData;

  // 3. Chuẩn bị dữ liệu cho SelectField
  const teacherOptions = teachers.map((teacher: { id: string; username: string }) => ({
    value: teacher.id,
    label: teacher.username,
  }));

  const gradeOptions = grades.map((grade: { id: number; level: number }) => ({
    value: grade.id,
    label: `${grade.level}`, // Thêm chữ "Khối" cho rõ ràng
  }));

  // 4. Thêm hiệu ứng animation cho form
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
  };

  return (
    // Sử dụng motion.form và gán variants
    <motion.form
      className="flex flex-col gap-6 bg-white p-6 rounded-lg" // Thêm padding và bg
      onSubmit={onSubmit}
      variants={formVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      autoComplete="off"
    >
      {/* 5. Cập nhật tiêu đề */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">
          {type === "create" ? "Tạo Lớp Học Mới" : "Cập Nhật Lớp Học"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Vui lòng điền thông tin bên dưới.
        </p>
      </div>

      {/* 6. Layout Grid responsive đẹp hơn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <InputField
            label="Tên lớp học"
            name="name"
            defaultValue={data?.name}
            register={register}
            error={errors?.name}
            inputProps={{
              placeholder: "Nhập tên lớp học (VD: 10A1, 11B2)"
            }}
          />
        </div>
        <div className="space-y-1">
          <InputField
            label="Số lượng học sinh"
            name="capacity"
            type="number"
            defaultValue={data?.capacity || 50}
            register={register}
            error={errors?.capacity}
            inputProps={{
              placeholder: "Số lượng học sinh tối đa",
              min: "1",
              max: "50",
              readOnly: true,
            
            }}
          />
        </div>

        {/* 7. Sử dụng SelectField đã refactor */}
        {type === "update" && (
          <div className="md:col-span-1">
            <SelectField
              label="Giáo viên chủ nhiệm"
              name="supervisorId"
              register={register}
              error={errors.supervisorId}
              options={teacherOptions}
              defaultValue={data?.supervisorId}
            />
          </div>
        )}

        <div className={type === "create" ? "md:col-span-2" : "md:col-span-1"}>
          <SelectField
            label="Chọn khối lớp"
            name="gradeId"
            register={register}
            error={errors.gradeId}
            options={gradeOptions}
            defaultValue={data?.gradeId}
          />
        </div>

        {/* Input ẩn cho ID (khi update) */}
        {data && (
          <input type="hidden" {...register("id")} defaultValue={data?.id} />
        )}
      </div>

      {/* 8. Cập nhật style cho thông báo lỗi server */}
      {state.error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm text-center">
          <span>Có lỗi xảy ra, vui lòng thử lại!</span>
        </div>
      )}

      {/* 9. Cập nhật style cho button */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold
                   hover:bg-blue-700 transition-colors duration-200
                   focus-visible:outline focus-visible:outline-2 
                   focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        {type === "create" ? "Tạo Lớp" : "Cập Nhật"}
      </button>
    </motion.form>
  );
};

export default ClassForm;