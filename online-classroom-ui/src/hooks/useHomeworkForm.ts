// hooks/useHomeworkForm.ts
"use client";

import { useState, useCallback } from "react";
import { HomeworkFormData, QuestionWithAnswer } from "@/types/homework";
import { homeworkSchema } from "@/lib/formValidationSchema";

export function useHomeworkForm() {
  const [formData, setFormData] = useState<HomeworkFormData>({
    title: "",
    duration: 60,
    startTime: "",
    endTime: "",
    maxAttempts: 1,
    points: 100,
    studentViewPermission: 'NO_VIEW',
    blockViewAfterSubmit: false,
    gradingMethod: 'FIRST_ATTEMPT',
    isShuffleQuestions: false,
    isShuffleAnswers: false
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

const updateFormData = useCallback((updates: Partial<HomeworkFormData>) => { // 1. Bọc hàm bằng useCallback
    setFormData(prev => ({ ...prev, ...updates }));
    
    const updatedFields = Object.keys(updates);

    // 2. Sử dụng callback bên trong setter để tránh phụ thuộc vào state bên ngoài
    setValidationErrors(prevErrors => {
      // Kiểm tra xem các trường (fields) vừa cập nhật có lỗi cũ không
      if (updatedFields.some(field => prevErrors[field])) {
        const newErrors = { ...prevErrors };
        // Xóa lỗi của các trường đó
        updatedFields.forEach(field => {
          delete newErrors[field];
        });
        return newErrors; // Trả về object lỗi mới
      }
      // Nếu không có gì thay đổi, trả về state lỗi cũ
      return prevErrors;
    });
  }, []); // 3. Mảng dependency rỗng vì hàm này giờ đã ổn định, không phụ thuộc state/props nào

  const validateForm = (additionalData?: any) => {
    const dataToValidate = {
      ...formData,
      ...additionalData
    };

    const result = homeworkSchema.safeParse(dataToValidate);
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((error: any) => {
        const path = error.path[0];
        if (path && typeof path === 'string') {
          errors[path] = error.message;
        }
      });
      setValidationErrors(errors);
      return false;
    }
    
    setValidationErrors({});
    return true;
  };

  const calculateQuestionPoints = (numQuestions: number, totalPoints: number): QuestionWithAnswer[] => {
    const basePointPerQuestion = Number((totalPoints / numQuestions).toFixed(2));
    let totalAssigned = 0;

    return Array.from({ length: numQuestions }, (_, index) => {
      let pointForThis;
      if (index === numQuestions - 1) {
        // Câu cuối: gán phần còn lại để đảm bảo tổng = totalPoints
        pointForThis = Number((totalPoints - totalAssigned).toFixed(2));
      } else {
        pointForThis = basePointPerQuestion;
        totalAssigned += pointForThis;
      }

      return {
        questionNumber: index + 1,
        answer: '',
        point: pointForThis
      };
    });
  };

  return {
    formData,
    updateFormData,
    validationErrors,
    validateForm,
    calculateQuestionPoints,
    setValidationErrors
  };
}