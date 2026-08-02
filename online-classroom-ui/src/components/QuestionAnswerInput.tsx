// components/QuestionAnswerInput.tsx
"use client";

import { useState } from "react";

interface QuestionAnswerInputProps {
  numQuestions: number;
  answers: string[];
  points: number;
  onNumQuestionsChange: (num: number) => void;
  onAnswerChange: (index: number, value: string) => void;
  onPointsChange: (points: number) => void;
  disabled?: boolean;
}

export default function QuestionAnswerInput({
  numQuestions,
  answers,
  points,
  onNumQuestionsChange,
  onAnswerChange,
  onPointsChange,
  disabled = false
}: QuestionAnswerInputProps) {
  const [quickAnswers, setQuickAnswers] = useState("");

  const handleQuickAnswers = () => {
    const arr = quickAnswers.trim().split("").slice(0, numQuestions);
    for (let i = 0; i < arr.length; i++) {
      onAnswerChange(i, arr[i]);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Câu Hỏi và Đáp Án</h2>
      
      {/* Số câu hỏi và điểm */}
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Số câu hỏi</label>
          <input
            type="number"
            min="1"
            value={numQuestions}
            onChange={(e) => onNumQuestionsChange(parseInt(e.target.value) || 1)}
            className="border rounded px-3 py-2 w-20"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tổng điểm</label>
          <input
            type="number"
            min="1"
            value={points}
            onChange={(e) => onPointsChange(parseInt(e.target.value) || 0)}
            className="border rounded px-3 py-2 w-24"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Nhập nhanh đáp án */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Nhập chuỗi đáp án (VD: ACDABCAD)"
          value={quickAnswers}
          onChange={(e) => setQuickAnswers(e.target.value.toUpperCase())}
          className="border rounded px-3 py-2 w-64"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={handleQuickAnswers}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={disabled}
        >
          Nhập nhanh
        </button>
      </div>

      <p className="text-sm">
        Số lượng đáp án đã nhập: <b className="text-red-600">{answers.filter(a => a).length}</b>
      </p>

      {/* Grid đáp án */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
        {Array.from({ length: numQuestions }).map((_, index) => (
          <div key={index} className="flex items-center gap-2 p-2 border rounded">
            <span className="text-sm font-medium w-8">C{index + 1}:</span>
            <select
              value={answers[index] || ''}
              onChange={(e) => onAnswerChange(index, e.target.value)}
              className="border rounded px-2 py-1 text-sm flex-1"
              disabled={disabled}
            >
              <option value="">--</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}