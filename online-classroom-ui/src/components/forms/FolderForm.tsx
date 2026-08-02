"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { folderSchema } from "@/lib/formValidationSchema";
import { z } from "zod";
import { createFolder, updateFolder } from "@/lib/actions/file.action";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

type FormData = z.infer<typeof folderSchema>;


interface FolderFormProps {
  type: "create" | "update";
  data?: {
    id: string;
    name: string;
    description?: string;
    color?: string;
    classCode: string;
  };
  classCode: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onSuccess?: () => void;
}

const FolderForm = ({ type, data, classCode, setOpen, onSuccess }: FolderFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: data?.name || "",
      description: data?.description || "",
      color: data?.color || "#3B82F6",
      classCode: classCode,
    },
  });

  const selectedColor = watch("color");

  const onSubmit = handleSubmit(async (formData) => {
    setIsLoading(true);
    try {
      if (type === "create") {
        const formDataForAction = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (key === "description") {
            // Chỉ append description nếu nó không rỗng
            if (value && value.trim()) {
              formDataForAction.append(key, value as string);
            }
          } else if (value) {
            formDataForAction.append(key, value as string);
          }
        });

        const result = await createFolder({ success: false, error: false }, formDataForAction);
        
        if (result.success) {
          toast.success("Tạo thư mục thành công!");
          setOpen(false);
          onSuccess?.();
        } else {
          toast.error("Có lỗi xảy ra khi tạo thư mục!");
        }
      } else if (type === "update" && data?.id) {
        const updateData = {
          id: data.id,
          ...formData,
        };
        
        // Convert empty description to null
        if (updateData.description && !updateData.description.trim()) {
          updateData.description = null;
        }
        
        const result = await updateFolder(updateData);
        
        if (result.success) {
          toast.success(result.message || "Cập nhật thư mục thành công!");
          setOpen(false);
          onSuccess?.();
        } else {
          toast.error(result.message || "Có lỗi xảy ra khi cập nhật thư mục!");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  });

  // Suggested colors
  const suggestedColors = [
    "#3B82F6", // Blue
    "#EF4444", // Red
    "#10B981", // Green
    "#F59E0B", // Yellow
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#6B7280", // Gray
    "#14B8A6", // Teal
  ];

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
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {type === "create" ? "Tạo thư mục mới" : "Chỉnh sửa thư mục"}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-5">

          {/* Folder name */}
          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Tên thư mục *
            </label>
            <input
              type="text"
              id="name"
              {...register("name")}
              className="block w-full rounded-lg border border-gray-300 shadow-sm p-3 text-sm
                         focus:border-blue-500 focus:ring-blue-500 transition duration-200
                         hover:border-gray-400"
              placeholder="Nhập tên thư mục..."
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
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
              rows={3}
              className="block w-full rounded-lg border border-gray-300 shadow-sm p-3 text-sm
                         focus:border-blue-500 focus:ring-blue-500 transition duration-200
                         hover:border-gray-400 resize-none"
              placeholder="Mô tả về thư mục..."
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Màu sắc
            </label>
            
            {/* Current color display */}
            <div className="flex items-center gap-3">
              <input
                type="color"
                {...register("color")}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border border-gray-200"
                  style={{ backgroundColor: selectedColor }}
                ></div>
                <span className="text-sm text-gray-600 font-mono">{selectedColor}</span>
              </div>
            </div>

            {/* Suggested colors */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Màu đề xuất:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue("color", color)}
                    className={`w-8 h-8 rounded border-2 transition-all hover:scale-105 ${
                      selectedColor === color
                        ? "border-gray-400 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Hidden fields */}
          <input type="hidden" {...register("classCode")} />

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg 
                         hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg 
                         hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading 
                ? (type === "create" ? "Đang tạo..." : "Đang cập nhật...") 
                : (type === "create" ? "Tạo thư mục" : "Cập nhật")
              }
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default FolderForm;