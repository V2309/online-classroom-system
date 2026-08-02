"use client";

import { useState, useEffect } from 'react';

interface QuestionCardGridProps {
  numQuestions?: number;
  answers?: string[];
  totalPoints?: number;
  onNumQuestionsChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnswerChange?: (index: number, value: string) => void;
  onPointsChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBulkAnswerChange?: (answers: string[]) => void;
  disabled?: boolean;
  // For edit mode
  questions?: Array<{
    id: number;
    questionNumber: number;
    content?: string;
    answer: string;
    point?: number;
  }>;
  readOnlyNumQuestions?: boolean;
  onQuestionsChange?: (questions: any[]) => void;
  isLoading?: boolean;
}

export default function QuestionCardGrid({
  numQuestions = 0,
  answers = [],
  totalPoints = 0,
  onNumQuestionsChange,
  onAnswerChange,
  onPointsChange,
  onBulkAnswerChange,
  disabled = false,
  // Edit mode props
  questions = [],
  readOnlyNumQuestions = false,
  onQuestionsChange,
  isLoading = false
}: QuestionCardGridProps) {
  const [quickAnswers, setQuickAnswers] = useState('');
  const [customTotalPoints, setCustomTotalPoints] = useState<number>(0);
  
  // Use questions for edit mode, or fallback to traditional props
  const isEditMode = questions.length > 0;
  const displayNumQuestions = isEditMode ? questions.length : numQuestions;
  const displayAnswers = isEditMode ? questions.map(q => q.answer) : answers;
  const autoCalculatedPoints = questions.reduce((sum, q) => sum + (q.point || 0), 0);
  
  // Initialize custom total points when in edit mode
  useEffect(() => {
    if (isEditMode && customTotalPoints === 0 && autoCalculatedPoints > 0) {
      setCustomTotalPoints(autoCalculatedPoints);
    }
  }, [isEditMode, customTotalPoints, autoCalculatedPoints]);
  

  // Nhập nhanh đáp án
  const handleQuickAnswers = () => {
    const inputString = quickAnswers.trim();
    const inputArray = inputString.split("");
    

    
    if (isEditMode && onQuestionsChange) {
      // Update questions in edit mode
      const updatedQuestions = questions.map((q, index) => ({
        ...q,
        answer: inputArray[index] || q.answer
      }));
      onQuestionsChange(updatedQuestions);
    } else if (onBulkAnswerChange) {
      // Sử dụng bulk update nếu có
      const newAnswers = [...displayAnswers];
      for (let i = 0; i < Math.min(inputArray.length, displayNumQuestions); i++) {
        newAnswers[i] = inputArray[i];
      }
      console.log("Bulk updating answers:", newAnswers);
      onBulkAnswerChange(newAnswers);
    } else {
      // Fallback về cách cũ
      inputArray.forEach((char, index) => {
        if (index < displayNumQuestions && onAnswerChange) {
          console.log(`Setting answer ${index} to '${char}'`);
          onAnswerChange(index, char);
        }
      });
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    console.log(`Changing answer ${index} to '${value}'`);
    if (isEditMode && onQuestionsChange) {
      const updatedQuestions = questions.map((q, qIndex) => 
        qIndex === index ? { ...q, answer: value } : q
      );
      console.log('Updated questions:', updatedQuestions);
      onQuestionsChange(updatedQuestions);
    } else if (onAnswerChange) {
      console.log('Using onAnswerChange callback');
      onAnswerChange(index, value);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Câu Hỏi</h2>
      
      {/* Controls */}
      <div className="mb-4 flex gap-4 items-end">
        <div>
          <label className="block mb-2">Số lượng câu hỏi:</label>
          <input
            type="number"
            min="0"
            value={displayNumQuestions}
            onChange={(e) => {
              const newValue = Number(e.target.value);
              if (isEditMode && onQuestionsChange) {
                // Logic đúng như trang add - tự động tính lại điểm cho tất cả câu
                const currentQuestions = [...questions];
                const currentTotalPoints = customTotalPoints > 0 ? customTotalPoints : autoCalculatedPoints;
                
                if (newValue > 0) {
                  // Tính điểm cho mỗi câu dựa trên tổng điểm
                  const basePointPerQuestion = Math.floor((currentTotalPoints / newValue) * 100) / 100;
                  const remainder = Math.round((currentTotalPoints - (basePointPerQuestion * (newValue - 1))) * 100) / 100;
                  
                  if (newValue > questions.length) {
                    // Thêm câu hỏi mới và cập nhật điểm cho tất cả câu
                    currentQuestions.forEach((q, idx) => {
                      q.point = idx === newValue - 1 ? remainder : basePointPerQuestion;
                    });
                    
                    for (let i = questions.length; i < newValue; i++) {
                      currentQuestions.push({
                        id: Date.now() + i,
                        questionNumber: i + 1,
                        content: `Câu hỏi ${i + 1}`,
                        answer: 'A',
                        point: i === newValue - 1 ? remainder : basePointPerQuestion
                      });
                    }
                  } else if (newValue < questions.length) {
                    // Xóa câu hỏi thừa và chia lại điểm cho câu còn lại
                    currentQuestions.splice(newValue);
                    currentQuestions.forEach((q, idx) => {
                      q.point = idx === newValue - 1 ? remainder : basePointPerQuestion;
                    });
                  } else {
                    // Cùng số lượng câu, chỉ cập nhật điểm
                    currentQuestions.forEach((q, idx) => {
                      q.point = idx === newValue - 1 ? remainder : basePointPerQuestion;
                    });
                  }
                }
                onQuestionsChange(currentQuestions);
              } else if (onNumQuestionsChange) {
                onNumQuestionsChange(e);
              }
            }}
            disabled={disabled}
            className="border rounded px-3 py-2 w-20"
          />
        </div>
        <div>
          <label className="block mb-2">Tổng điểm:</label>
          <input
            type="number"
            min="1"
            step="0.1"
            value={isEditMode ? (customTotalPoints || autoCalculatedPoints) : totalPoints}
            onChange={(e) => {
              const newValue = Number(e.target.value) || 0;
              if (isEditMode) {
                setCustomTotalPoints(newValue);
                // Tự động chia lại điểm cho các câu hỏi như trang add
                if (newValue > 0 && questions.length > 0) {
                  const pointPerQuestion = Math.round((newValue / questions.length) * 100) / 100;
                  const updatedQuestions = questions.map(q => ({
                    ...q,
                    point: pointPerQuestion
                  }));
                  if (onQuestionsChange) {
                    onQuestionsChange(updatedQuestions);
                  }
                }
              } else if (onPointsChange) {
                onPointsChange(e);
              }
            }}
            disabled={disabled}
            className="border rounded px-3 py-2 w-24"
          />
        </div>
        {isLoading && (
          <div className="text-sm text-blue-600 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Đang lưu...
          </div>
        )}
      </div>
      
      {/* Quick Answer Input */}
      <div className="mb-4 flex gap-2 items-center">
        <input
          type="text"
          placeholder="Nhập chuỗi đáp án (VD: ACDABCAD)"
          value={quickAnswers}
          onChange={e => setQuickAnswers(e.target.value.toUpperCase())}
          disabled={disabled}
          className="border rounded px-3 py-2 w-64"
        />
        <button
          type="button"
          onClick={handleQuickAnswers}
          disabled={disabled}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          Nhập nhanh đáp án
        </button>
      </div>
      
      <p className='mb-4'>Số lượng đáp án đã nhập: <b className='text-red-600'>{quickAnswers.length}</b></p>
      
      {/* Question Cards Grid với scroll */}
      <div className="relative">
        {/* Scroll container với scroll indicator */}
        <div className="max-h-[500px] overflow-y-auto border rounded-lg p-3 bg-gray-50 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: displayNumQuestions }).map((_, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow min-h-[140px]">
                <div className="font-semibold text-blue-700 mb-3 text-center bg-blue-50 py-1 rounded">
                  Câu {index + 1}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đáp án</label>
                    <input
                      type="text"
                      value={displayAnswers[index] || ''}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      disabled={disabled}
                      placeholder="Nhập đáp án..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Điểm</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={isEditMode ? (questions[index]?.point || 0) : 
                        displayNumQuestions > 0 ? 
                          index === displayNumQuestions - 1 ? 
                            (totalPoints - (Math.round((totalPoints / displayNumQuestions) * 100) / 100) * (displayNumQuestions - 1)).toFixed(2) :
                            (Math.round((totalPoints / displayNumQuestions) * 100) / 100).toFixed(2) :
                          '0'
                      }
                      onChange={(e) => {
                        if (isEditMode && onQuestionsChange) {
                          const newPoint = Number(e.target.value) || 0;
                          const updatedQuestions = questions.map((q, qIndex) => 
                            qIndex === index ? { ...q, point: newPoint } : q
                          );
                          onQuestionsChange(updatedQuestions);
                        }
                      }}
                      disabled={disabled || !isEditMode}
                      className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-center font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        isEditMode ? 'bg-white' : 'bg-gray-50 text-gray-600'
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Scroll indicator */}
        {displayNumQuestions > 9 && (
          <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full opacity-75">
            Scroll để xem thêm
          </div>
        )}
      </div>
    </div>
  );
}