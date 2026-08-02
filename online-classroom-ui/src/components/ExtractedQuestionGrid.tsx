"use client";

import React from 'react';

interface QuizQuestion {
  question_number: number;
  question_text: string;
  options: string[];
  correct_answer_char: string;
  correct_answer_index: number;
}

interface ExtractedQuestionGridProps {
  questions: QuizQuestion[];
  selectedQuestions: number[];
  onToggleQuestion: (questionNumber: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export default function ExtractedQuestionGrid({
  questions,
  selectedQuestions,
  onToggleQuestion,
  onSelectAll,
  onDeselectAll
}: ExtractedQuestionGridProps) {
  const validQuestions = questions.filter(item => typeof item.question_number === 'number');

  return (
    <div className="border rounded-lg p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-lg font-semibold">Câu Hỏi Đã Tách ({validQuestions.length} câu)</h2>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
          >
            Chọn tất cả
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            className="px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
          >
            Bỏ chọn
          </button>


        </div>
      </div>

      <div className="border rounded p-4 min-h-[600px] h-[80vh] overflow-auto">
        <div className="space-y-4">
          {validQuestions.map((question, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedQuestions.includes(question.question_number) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onToggleQuestion(question.question_number)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedQuestions.includes(question.question_number) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    }`}
                  >
                    {selectedQuestions.includes(question.question_number) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 mb-2">{question.question_text}</h3>

                  <div className="space-y-1 text-sm">
                    {question.options?.map((option, optionIndex) => {
                      const optionLabel = String.fromCharCode(65 + optionIndex);
                      const isCorrect =
                        question.correct_answer_char === optionLabel ||
                        (option && question.correct_answer_char && option.trim().startsWith(question.correct_answer_char));

                      return (
                        <div
                          key={optionIndex}
                          className={`p-2 rounded ${isCorrect ? 'bg-green-100 text-green-800 font-medium' : 'bg-gray-50 text-gray-700'}`}
                        >
                          {option}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    Đáp án: <span className="font-bold text-green-600">{question.correct_answer_char}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}