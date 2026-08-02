'use client';

import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Save } from 'lucide-react';

interface Question {
  id: number;
  questionNumber: number | null;
  content?: string | null;
  answer: string;
  point?: number | null;
  options?: any;
  questionType: string | null;
  homeworkId?: number;
  homeworkSubmissionId?: number | null;
}

interface ExtractedQuestionEditGridProps {
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
  isLoading?: boolean;
}

export default function ExtractedQuestionEditGrid({
  questions: initialQuestions,
  onQuestionsChange,
  isLoading = false
}: ExtractedQuestionEditGridProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setQuestions(initialQuestions);
    setHasChanges(false);
  }, [initialQuestions]);

  const handleQuestionChange = (questionId: number, field: keyof Question, value: any) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId 
        ? { ...q, [field]: value }
        : q
    );
    setQuestions(updatedQuestions);
    onQuestionsChange(updatedQuestions);
    setHasChanges(true);
  };

  const handleOptionChange = (questionId: number, optionIndex: number, value: string) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: Array.isArray(q.options) 
              ? q.options.map((opt: string, idx: number) => idx === optionIndex ? value : opt)
              : q.options
          }
        : q
    );
    setQuestions(updatedQuestions);
    onQuestionsChange(updatedQuestions);
    setHasChanges(true);
  };

  const addNewQuestion = () => {
    const newQuestionNumber = Math.max(...questions.map(q => q.questionNumber || 0)) + 1;
    const newQuestion: Question = {
      id: Date.now(), // Temporary ID for new questions
      questionNumber: newQuestionNumber,
      content: `Câu hỏi ${newQuestionNumber}`,
      answer: 'A',
      point: 1,
      options: ['A. Đáp án A', 'B. Đáp án B', 'C. Đáp án C', 'D. Đáp án D'],
      questionType: 'multiple_choice'
    };
    setQuestions(prev => [...prev, newQuestion]);
    setEditingId(newQuestion.id);
    setHasChanges(true);
  };

  const removeQuestion = (questionId: number) => {
    if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      setQuestions(prev => {
        const filtered = prev.filter(q => q.id !== questionId);
        // Renumber questions
        return filtered.map((q, index) => ({ ...q, questionNumber: index + 1 }));
      });
      setHasChanges(true);
      if (editingId === questionId) {
        setEditingId(null);
      }
    }
  };

  const calculateTotalPoints = () => {
    return questions.reduce((sum, q) => sum + (q.point || 0), 0);
  };

  return (
    <div className="space-y-4">
      {/* Header with editable stats and save button */}
      <div className="p-4 bg-gray-50 rounded-lg space-y-4">
        {/* Editable inputs row */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Số lượng câu hỏi:</label>
            <input
              type="number"
              min="0"
              value={questions.length}
              className="w-20 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              readOnly
              style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}
              title="Tự động tính từ số câu hỏi hiện có"
            />
            <span className="text-xs text-gray-500">Chỉ đọc trong chế độ chỉnh sửa</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Tổng điểm:</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={calculateTotalPoints().toFixed(1)}
              className="w-20 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              readOnly
              style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}
              title="Tự động tính từ điểm từng câu"
            />
            <span className="text-xs text-gray-500">Tự động tính từ điểm từng câu</span>
          </div>
        </div>
        
        {/* Save button row */}
        <div className="flex items-center justify-end space-x-2">
          {hasChanges && (
            <span className="text-sm text-amber-600 font-medium">
              Có thay đổi chưa lưu - Sẽ lưu khi Hoàn Thành
            </span>
          )}
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={question.id} className="bg-white border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg">Câu {question.questionNumber || (index + 1)}</span>
                <span className="text-sm text-gray-500">
                  ({question.point || 0} điểm)
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingId(editingId === question.id ? null : question.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Chỉnh sửa"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeQuestion(question.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {editingId === question.id ? (
              // Edit mode
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nội dung câu hỏi
                  </label>
                  <textarea
                    value={question.content || ''}
                    onChange={(e) => handleQuestionChange(question.id, 'content', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Nhập nội dung câu hỏi..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Các đáp án
                  </label>
                  <div className="space-y-2">
                    {Array.isArray(question.options) && question.options.map((option: string, idx: number) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={option.charAt(0) === question.answer}
                          onChange={() => handleQuestionChange(question.id, 'answer', option.charAt(0))}
                          className="text-blue-600"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(question.id, idx, e.target.value)}
                          className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Điểm
                    </label>
                    <input
                      type="number"
                      value={question.point || 0}
                      onChange={(e) => handleQuestionChange(question.id, 'point', parseFloat(e.target.value) || 0)}
                      onBlur={(e) => {
                        // Đảm bảo điểm không bị reset về 0 khi blur
                        const value = parseFloat(e.target.value);
                        if (isNaN(value) || value < 0) {
                          handleQuestionChange(question.id, 'point', 0);
                        }
                      }}
                      className="w-20 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            ) : (
              // View mode
              <div className="space-y-3">
                <div className="text-gray-900">
                  {question.content}
                </div>
                
                <div className="space-y-1">
                  {Array.isArray(question.options) && question.options.map((option: string, idx: number) => (
                    <div
                      key={idx}
                      className={`p-2 rounded ${
                        option.charAt(0) === question.answer
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new question button */}
      <button
        onClick={addNewQuestion}
        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors flex items-center justify-center space-x-2"
      >
        <Plus className="w-5 h-5" />
        <span>Thêm Câu Hỏi Mới</span>
      </button>
    </div>
  );
}
