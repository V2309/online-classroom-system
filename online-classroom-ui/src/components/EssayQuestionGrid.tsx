import React from 'react';

interface EssayQuestion {
  question_number: number;
  question_text: string;
  suggested_answer: string;
}

interface EssayQuestionGridProps {
  questions: EssayQuestion[];
  selectedQuestions: number[];
  onToggleQuestion: (questionNumber: number) => void;
  className?: string;
}

export default function EssayQuestionGrid({ 
  questions, 
  selectedQuestions, 
  onToggleQuestion,
  className = ""
}: EssayQuestionGridProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {questions.map((question) => (
        <div
          key={question.question_number}
          className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
            selectedQuestions.includes(question.question_number)
              ? 'border-green-500 bg-green-50 shadow-md'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }`}
          onClick={() => onToggleQuestion(question.question_number)}
        >
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <div className="flex-shrink-0 mt-1">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                selectedQuestions.includes(question.question_number)
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300'
              }`}>
                {selectedQuestions.includes(question.question_number) && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>

            {/* Question content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Câu {question.question_number}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Tự luận
                </span>
              </div>
              
              <div className="mb-3">
                <h4 className="font-medium text-gray-900 mb-2">Câu hỏi:</h4>
                <p className="text-gray-700 leading-relaxed">
                  {question.question_text}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Đáp án gợi ý:</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {question.suggested_answer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}