"use client";

import { useState, useEffect } from "react";

interface Grade {
  id: number;
  level: string;
}

interface GradeSelectionProps {
  grades: Grade[];
  currentGradeId: number;
  currentGradeLevel: string;
}

export default function GradeSelection({ grades, currentGradeId, currentGradeLevel }: GradeSelectionProps) {
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [showNewGradeInput, setShowNewGradeInput] = useState(false);
  const [newGradeValue, setNewGradeValue] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Đảm bảo hydration consistency
  useEffect(() => {
    setIsClient(true);
    // Chỉ set selectedGrade nếu có giá trị hợp lệ
    if (currentGradeId && currentGradeId > 0) {
      setSelectedGrade(currentGradeId.toString());
    }
  }, [currentGradeId]);

  const handleGradeChange = (gradeId: string) => {
    setSelectedGrade(gradeId);
    if (gradeId === "other") {
      setShowNewGradeInput(true);
      // Focus on the input field - chỉ chạy trên client
      if (typeof window !== "undefined") {
        setTimeout(() => {
          const input = document.getElementById('newGradeInput') as HTMLInputElement;
          if (input) {
            input.focus();
          }
        }, 100);
      }
    } else {
      setShowNewGradeInput(false);
      setNewGradeValue("");
    }
  };

  // Render placeholder during hydration
  if (!isClient) {
    return (
      <div className="mb-6">
        <label className="block text-gray-800 font-bold mb-2">Khối lớp</label>
        <p className="text-sm text-gray-600 mb-3">
          Khối hiện tại: <span className="font-semibold text-blue-600">{currentGradeLevel}</span>
        </p>
        <div className="flex flex-wrap gap-5 mb-2 mt-2  ">
          {grades.map((g) => (
            <span key={g.id} className="px-5 py-2 rounded-full font-semibold bg-gray-200 text-gray-800 mt-2 ">
              {g.level}
            </span>
          ))}
          <span className="px-5 py-2 rounded-full font-semibold bg-green-100 text-green-800">
            ➕ Khác
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Chọn khối lớp phù hợp hoặc chọn Khác để tạo khối mới
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Hidden inputs để gửi giá trị về server */}
      <input 
        type="hidden" 
        name="gradeId" 
        value={selectedGrade === "other" ? "" : selectedGrade} 
      />
      <input 
        type="hidden" 
        name="newGradeLevel" 
        value={selectedGrade === "other" ? newGradeValue : ""} 
      />
      
      <div className="mb-6">
        <label className="block text-gray-800 font-bold mb-2">Khối lớp</label>
        <p className="text-sm text-gray-600 mb-3">
          Khối hiện tại: <span className="font-semibold text-blue-600">{currentGradeLevel}</span>
        </p>
        <div className="flex flex-wrap gap-5 mb-2" suppressHydrationWarning>
          {grades.map((g) => (
            <label key={g.id} className="cursor-pointer">
              <input
                type="radio"
                name="gradeSelection"
                value={g.id}
                checked={selectedGrade === g.id.toString()}
                onChange={(e) => handleGradeChange(e.target.value)}
                className="hidden peer"
              />
              <span className={`px-5 py-2 rounded-full font-semibold select-none transition-all ${
                selectedGrade === g.id.toString() 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}>
                {g.level}
              </span>
            </label>
          ))}
          {/* Nút "Khác" để thêm grade mới */}
          <label className="cursor-pointer">
            <input
              type="radio"
              name="gradeSelection"
              value="other"
              checked={selectedGrade === "other"}
              onChange={(e) => handleGradeChange(e.target.value)}
              className="hidden peer"
            />
            <span className={`px-5 py-2 rounded-full font-semibold select-none transition-all ${
              selectedGrade === "other" 
                ? "bg-green-500 text-white" 
                : "bg-green-100 text-green-800 hover:bg-green-200"
            }`}>
              ➕ Khác
            </span>
          </label>
        </div>
        
        {/* Ô input hiện ra khi chọn "Khác" */}
        {showNewGradeInput && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <label htmlFor="newGradeInput" className="block text-sm font-medium text-green-800 mb-2">
              Nhập tên khối mới:
            </label>
            <input
              type="text"
              id="newGradeInput"
              value={newGradeValue}
              onChange={(e) => setNewGradeValue(e.target.value)}
              className="w-full border border-green-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              placeholder="Ví dụ: Lớp 11, Khối A1, 12A2..."
              autoComplete="off"
            />
            <p className="text-xs text-green-600 mt-1">
              💡 Khối mới sẽ được tạo tự động khi bạn bấm Lưu lại
            </p>
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-2">
          Chọn khối lớp phù hợp hoặc chọn Khác để tạo khối mới
        </p>
      </div>
    </>
  );
}
