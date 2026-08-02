"use client";

import { useState, MutableRefObject } from "react";
import { CheckCircle2, FileText, Lightbulb, ListChecks, Star } from "lucide-react";

interface Question {
  id: number;
  content: string;
  options: string[];
  point?: number;
  answer?: string; // Thêm trường answer từ database
}

interface ExtractedQuestionsViewProps {
  questions: Question[];
  onAnswerChange?: (questionId: number, answer: string) => void;
  questionRefs?: MutableRefObject<Record<number, HTMLDivElement | null>>;
}

export function ExtractedQuestionsView({ questions, onAnswerChange, questionRefs }: ExtractedQuestionsViewProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    if (onAnswerChange) {
      onAnswerChange(questionId, answer);
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center">
          <FileText className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-xl font-semibold text-gray-700">Không có câu hỏi nào</p>
          <p className="text-gray-500 mt-2 max-w-sm">
            Tài liệu bạn cung cấp không chứa câu hỏi trắc nghiệm hoặc không thể phân tích được.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50  rounded-xl shadow-inner-lg overflow-y-hidden">
      <div className=" mx-auto">
        {/* Header thông tin đề thi */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <ListChecks className="w-7 h-7" />
            Đề thi trắc nghiệm
          </h3>
          <p className="text-blue-100 text-sm mt-2">
            Tổng số câu hỏi: <span className="font-bold text-lg">{questions.length}</span>
          </p>
        </div>

        {/* Danh sách câu hỏi */}
        <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
          {questions.map((question, index) => (
            <div 
              key={question.id} 
              ref={(el) => {
                if (questionRefs && questionRefs.current) {
                  questionRefs.current[question.id] = el;
                }
              }}
              className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-blue-600 text-white rounded-full w-9 h-9 flex items-center justify-center text-md font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 leading-relaxed text-lg">
                    {question.content}
                  </div>
                  {question.point && (
                    <div className="inline-flex items-center mt-3 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                      <Star className="w-3.5 h-3.5 mr-1" />
                      {question.point} điểm
                    </div>
                  )}
                </div>
              </div>
              
              {/* Hiển thị các lựa chọn có thể click */}
              {question.options && question.options.length > 0 && (
                <div className="ml-13 space-y-2">
                  {question.options.map((option, optIndex) => {
                    const optionLetter = String.fromCharCode(65 + optIndex);
                    const isSelected = selectedAnswers[question.id] === optionLetter;
                    
                    return (
                      <div 
                        key={optIndex} 
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => handleAnswerSelect(question.id, optionLetter)}
                      >
                        <div className={`rounded-full w-7 h-7 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5 transition-colors duration-200 ${
                          isSelected 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-300 text-gray-800'
                        }`}>
                          {isSelected ? <CheckCircle2 className="w-5 h-5"/> : optionLetter}
                        </div>
                        <span className="text-gray-800 leading-relaxed text-base">
                          {option.trim().match(/^[A-D]\./i) ? option : `${optionLetter}. ${option}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
        
      
      </div>
    </div>
  );
}