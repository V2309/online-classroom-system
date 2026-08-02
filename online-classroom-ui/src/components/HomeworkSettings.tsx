// components/HomeworkSettings.tsx
"use client";

import { useState, useEffect } from 'react';

// Giả định bạn có type này ở "@/types/homework"
interface HomeworkFormData {
  title: string;
  duration: number;
  startTime: string;
  endTime: string;
  maxAttempts: number;
  studentViewPermission: 'NO_VIEW' | 'SCORE_ONLY' | 'SCORE_AND_RESULT';
  gradingMethod: 'FIRST_ATTEMPT' | 'LATEST_ATTEMPT' | 'HIGHEST_ATTEMPT';
  blockViewAfterSubmit: boolean;
  isShuffleQuestions?: boolean;
  isShuffleAnswers?: boolean;
  type?: 'original' | 'extracted' | 'essay';
}

interface HomeworkSettingsProps {
  data?: HomeworkFormData;
  onChange?: (data: Partial<HomeworkFormData>) => void;
  validationErrors?: Record<string, string>;
  disabled?: boolean;
  type?: 'original' | 'extracted' | 'essay';
  // Edit mode props
  currentData?: HomeworkFormData;
  isEditMode?: boolean;
  onSave?: (data: any) => Promise<void>;
  isLoading?: boolean;
}

// Icon ? (Dùng SVG cho đẹp và linh hoạt)
const HelpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5 text-gray-400 cursor-help"

  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
    />
  </svg>
);

// Component ToggleSwitch để thay thế checkbox
const ToggleSwitch = ({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex items-center h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ${
      checked ? 'bg-blue-600' : 'bg-gray-200'
    } transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
  >
    <span
      aria-hidden="true"
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ${
        checked ? 'translate-x-5' : 'translate-x-0'
      } transition-transform duration-200 ease-in-out`}
    />
  </button>
);

export default function HomeworkSettings({
  data,
  onChange,
  validationErrors = {},
  disabled = false,
  type = 'original',
  // Edit mode props
  currentData,
  isEditMode = false,
  onSave,
  isLoading = false
}: HomeworkSettingsProps) {
  // Debug logs
 

  const [formData, setFormData] = useState<HomeworkFormData>(
    currentData || data || {
      title: '',
      duration: 60,
      startTime: '',
      endTime: '',
      maxAttempts: 1,
      studentViewPermission: 'NO_VIEW',
      gradingMethod: 'FIRST_ATTEMPT',
      blockViewAfterSubmit: false,
      isShuffleQuestions: false,
      isShuffleAnswers: false
    }
  );

  // Remove auto-sync to prevent infinite re-renders
  // useEffect(() => {
  //   if (currentData) {
  //     console.log('Syncing formData with currentData:', currentData);
  //     setFormData(currentData);
  //   }
  // }, [currentData?.title, currentData?.duration, currentData?.startTime, currentData?.endTime, currentData?.maxAttempts]);

  console.log('Current formData state:', formData);

  const handleChange = (updates: Partial<HomeworkFormData>) => {
    console.log('HomeworkSettings handleChange called with:', updates);
    console.log('Current formData before update:', formData);
    
    const newData = { ...formData, ...updates };
    console.log('New formData after update:', newData);
    
    setFormData(newData);
    
    // Always call onChange to notify parent
    if (onChange) {
      // Convert datetime-local to proper format for backend
      const processedUpdates = { ...updates };
      if (updates.startTime) {
        processedUpdates.startTime = updates.startTime;
      }
      if (updates.endTime) {
        processedUpdates.endTime = updates.endTime;
      }
      
      console.log('Calling parent onChange with:', processedUpdates);
      onChange(processedUpdates);
    } else {
      console.log('No onChange callback provided');
    }
  };

  const handleSave = async () => {
    if (isEditMode && onSave) {
      await onSave(formData);
    }
  };

  return (
    // Card container
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Thiết lập bài tập</h2>

      {/* Tiêu đề */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Tiêu đề bài tập *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => {
            console.log('Title input onChange:', e.target.value);
            handleChange({ title: e.target.value });
          }}
          className={`border rounded px-3 py-2 w-full ${
            validationErrors.title ? 'border-red-500' : ''
          }`}
          required
        />
        {validationErrors.title && (
          <p className="text-red-500 text-sm mt-1">
            {validationErrors.title}
          </p>
        )}
      </div>

      {/* Các cài đặt còn lại */}
      <div className="space-y-4 border-t border-gray-200 pt-6">
        {/* Thời lượng */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3 pt-2">
            <HelpIcon />
            <label className="text-sm font-medium text-gray-800">
              Thời lượng (phút) *
            </label>
          </div>
          <div className="flex-shrink-0 w-64"> {/* <-- Đổi w-48 thành w-64 cho đồng bộ */}
            <input
              type="number"
              min="1"
              value={formData.duration}
              onChange={(e) => {
                console.log('Duration input onChange:', e.target.value);
                handleChange({ duration: Number(e.target.value) });
              }}
              className={`border rounded px-3 py-2 w-full ${
                validationErrors.duration ? 'border-red-500' : ''
              }`}
            />
            {validationErrors.duration && (
              <p className="text-red-500 text-sm mt-1">
                {validationErrors.duration}
              </p>
            )}
          </div>
        </div>

        {/* Thời gian bắt đầu */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3 pt-2">
            <HelpIcon />
            <label className="text-sm font-medium text-gray-800">
              Thời gian bắt đầu *
            </label>
          </div>
          <div className="flex-shrink-0 w-64">
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => {
                console.log('StartTime input onChange:', e.target.value);
                handleChange({ startTime: e.target.value });
              }}
              className={`border rounded px-3 py-2 w-full ${
                validationErrors.startTime ? 'border-red-500' : ''
              }`}
            />
            {validationErrors.startTime && (
              <p className="text-red-500 text-sm mt-1">
                {validationErrors.startTime}
              </p>
            )}
          </div>
        </div>

        {/* Hạn chót */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3 pt-2">
            <HelpIcon />
            <label className="text-sm font-medium text-gray-800">
              Hạn chót nộp bài *
            </label>
          </div>
          <div className="flex-shrink-0 w-64">
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => {
                console.log('EndTime input onChange:', e.target.value);
                handleChange({ endTime: e.target.value });
              }}
              className={`border rounded px-3 py-2 w-full ${
                validationErrors.endTime ? 'border-red-500' : ''
              }`}
            />
            {validationErrors.endTime && (
              <p className="text-red-500 text-sm mt-1">
                {validationErrors.endTime}
              </p>
            )}
          </div>
        </div>

        {/* Số lần làm bài - Ẩn với bài tự luận */}
        {type !== 'essay' && (
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3 pt-2">
              <HelpIcon />
              <label className="text-sm font-medium text-gray-800">
                Số lần làm bài tối đa *
              </label>
            </div>
          <div className="flex-shrink-0 w-64">
            <input
              type="number"
              min="1"
              value={formData.maxAttempts}
              onChange={(e) => {
                console.log('MaxAttempts input onChange:', e.target.value);
                handleChange({ maxAttempts: Number(e.target.value) });
              }}
              className={`border rounded px-3 py-2 w-full ${
                validationErrors.maxAttempts ? 'border-red-500' : ''
              }`}
            />
            {validationErrors.maxAttempts && (
              <p className="text-red-500 text-sm mt-1">
                {validationErrors.maxAttempts}
              </p>
            )}
          </div>
        </div>
        )}

        {/* Quyền xem điểm của học sinh (Dropdown) - CẬP NHẬT */}
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center space-x-3">
            <HelpIcon />
            <label className="text-sm font-medium text-gray-800">
              Quyền của học sinh
            </label>
          </div>
          <div className="flex-shrink-0 w-64 relative"> {/* <-- Thêm w-64 và relative */}
            <select
              value={formData.studentViewPermission}
              onChange={(e) => {
                console.log('StudentViewPermission select onChange:', e.target.value);
                handleChange({ studentViewPermission: e.target.value as any });
              }}
              className="border rounded px-3 py-2 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full appearance-none"
            >
              <option value="NO_VIEW">Không được xem điểm</option>
              <option value="SCORE_ONLY">Chỉ xem điểm tổng</option>
              <option value="SCORE_AND_RESULT">Xem điểm và chi tiết</option>
            </select>
            {/* Mũi tên tùy chỉnh */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M5.516 7.548c.436-.446 1.144-.446 1.58 0L10 10.405l2.904-2.857c.436-.446 1.144-.446 1.58 0 .436.446.436 1.17 0 1.615l-3.694 3.639c-.436.446-1.144.446-1.58 0L5.516 9.163c-.436-.446-.436-1.17 0-1.615z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Phương pháp chấm điểm (Dropdown) - CẬP NHẬT */}
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center space-x-3">
            <HelpIcon />
            <label className="text-sm font-medium text-gray-800">
              Phương pháp chấm điểm
            </label>
          </div>
          <div className="flex-shrink-0 w-64 relative"> {/* <-- Thêm w-64 và relative */}
            <select
              value={formData.gradingMethod}
              onChange={(e) =>
                handleChange({ gradingMethod: e.target.value as any })
              }
              className="border rounded px-3 py-2 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full appearance-none"
            >
              <option value="FIRST_ATTEMPT">Lấy điểm lần làm bài đầu tiên</option>
              <option value="LATEST_ATTEMPT">Lấy điểm lần làm bài mới nhất</option>
              <option value="HIGHEST_ATTEMPT">Lấy điểm lần làm bài cao nhất</option>
            </select>
            {/* Mũi tên tùy chỉnh */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M5.516 7.548c.436-.446 1.144-.446 1.58 0L10 10.405l2.904-2.857c.436-.446 1.144-.446 1.58 0 .436.446.436 1.17 0 1.615l-3.694 3.639c-.436.446-1.144.446-1.58 0L5.516 9.163c-.436-.446-.436-1.17 0-1.615z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Chặn xem lại đề (Toggle) */}
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center space-x-3">
            <HelpIcon />
            <label className="text-sm font-medium text-gray-800">
              Chặn học sinh xem lại đề
            </label>
          </div>
          <div className="flex-shrink-0">
            <ToggleSwitch
              checked={formData.blockViewAfterSubmit}
              onChange={(checked) =>
                handleChange({ blockViewAfterSubmit: checked })
              }
            />
          </div>
        </div>
      </div>

      {/* Shuffle Settings - chỉ hiển thị cho type extracted */}
      {/* Đảo thứ tự câu hỏi và đáp án - chỉ hiển thị cho bài tập extracted */}
      {type === 'extracted' && (
        <>
          {/* Đảo thứ tự câu trong đề */}
          <div className="mb-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Đảo thứ tự câu trong đề
                </label>
                <HelpIcon />
              </div>
              <div className="flex-shrink-0">
                <ToggleSwitch
                  checked={formData.isShuffleQuestions || false}
                  onChange={(checked) =>
                    handleChange({ isShuffleQuestions: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Đảo thứ tự câu trả lời */}
          <div className="mb-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Đảo thứ tự câu trả lời
                </label>
                <HelpIcon />
              </div>
              <div className="flex-shrink-0">
                <ToggleSwitch
                  checked={formData.isShuffleAnswers || false}
                  onChange={(checked) =>
                    handleChange({ isShuffleAnswers: checked })
                  }
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}