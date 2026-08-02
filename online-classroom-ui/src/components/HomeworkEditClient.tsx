'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileViewer from './FileViewer';
import QuestionCardGrid from './QuestionCardGrid';
import ExtractedQuestionEditGrid from './ExtractedQuestionEditGrid';
import HomeworkSettings from './HomeworkSettings';
import { updateHomeworkWithQuestions, updateHomeworkSettings } from '@/lib/actions/actions';
import { toast } from 'react-hot-toast';

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

interface Homework {
  id: number;
  title: string;
  type: string | null;
  originalFileUrl?: string | null;
  originalFileName?: string | null;
  originalFileType?: string | null;
  startTime: Date | null;
  endTime: Date | null;
  duration: number | null;
  maxAttempts: number | null;
  points: number | null;
  studentViewPermission: 'NO_VIEW' | 'SCORE_ONLY' | 'SCORE_AND_RESULT';
  blockViewAfterSubmit: boolean;
  gradingMethod: 'FIRST_ATTEMPT' | 'LATEST_ATTEMPT' | 'HIGHEST_ATTEMPT';
  isShuffleQuestions?: boolean | null;
  isShuffleAnswers?: boolean | null;
  questions: Question[];
  attachments: Array<{
    id: number;
    name: string;
    url: string | null;
    type: string;
    size?: number;
    homeworkId?: number;
  }>;
  class: {
    class_code: string | null;
    title?: string;
    name: string;
    id: number;
    img?: string | null;
    capacity: number;
    gradeId: number;
    supervisorId?: string | null;
    isProtected: boolean;
    isLocked: boolean;
    requiresApproval: boolean;
    blockLeave: boolean;
    allowGradesView: boolean;
    deleted: boolean;
    deletedAt?: Date | null;
  } | null;
}

interface HomeworkEditClientProps {
  homework: Homework;
  classId: string;
}

export default function HomeworkEditClient({ homework, classId }: HomeworkEditClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [questions, setQuestions] = useState(homework.questions);
  const [isLoading, setIsLoading] = useState(false);
  const [customTotalPoints, setCustomTotalPoints] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState(homework.questions);
  const [pendingSettings, setPendingSettings] = useState<any>(null);

  // Helper function to format datetime for backend
  const formatDateTimeForBackend = (date: Date | string) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return new Date().toISOString().slice(0, 16);
    }
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  // Debug log to check initial data
  console.log('HomeworkEditClient initialized with:', {
    homeworkQuestions: homework.questions,
    questionsState: questions,
    pendingQuestions: pendingQuestions
  });

  const steps = [
    { number: 1, title: 'Tùy Chỉnh Đáp Án', description: 'Chỉnh sửa câu hỏi và đáp án' },
    { number: 2, title: 'Cài Đặt', description: 'Thiết lập bài tập' }
  ];

  const handleQuestionsUpdate = (updatedQuestions: Question[]) => {
    console.log('HomeworkEditClient: handleQuestionsUpdate called with:', updatedQuestions);
    // Cập nhật cả local state và pending state
    setQuestions(updatedQuestions);
    setPendingQuestions(updatedQuestions);
    setHasUnsavedChanges(true);
  };

  const handleSettingsUpdate = (settings: any) => {
    console.log('Received settings update:', settings);
    
    // Merge với settings hiện tại thay vì ghi đè hoàn toàn
    setPendingSettings((prev: any) => {
      const merged = {
        ...prev,
        ...settings
      };
      console.log('Merged pending settings:', merged);
      return merged;
    });
    setHasUnsavedChanges(true);
  };

  const saveAllChanges = async () => {
    setIsLoading(true);
    try {
      // Lưu questions nếu có thay đổi
      if (hasUnsavedChanges && pendingQuestions.length > 0) {
        const transformedQuestions = pendingQuestions.map(q => ({
          id: q.id,
          questionNumber: q.questionNumber || 0,
          content: q.content || '',
          answer: q.answer,
          point: q.point || 0,
          options: Array.isArray(q.options) ? q.options : undefined
        }));
        
        await updateHomeworkWithQuestions(homework.id, transformedQuestions);
      }
      
      // Lưu settings - đảm bảo có đầy đủ dữ liệu
      const currentSettings = {
        title: homework.title || 'Bài tập',
        startTime: homework.startTime ? formatDateTimeForBackend(homework.startTime) : new Date().toISOString().slice(0, 16),
        endTime: homework.endTime ? formatDateTimeForBackend(homework.endTime) : new Date(Date.now() + 24*60*60*1000).toISOString().slice(0, 16),
        duration: homework.duration || 60,
        maxAttempts: homework.maxAttempts || 1,
        studentViewPermission: homework.studentViewPermission || 'NO_VIEW',
        blockViewAfterSubmit: homework.blockViewAfterSubmit || false,
        gradingMethod: homework.gradingMethod || 'FIRST_ATTEMPT',
        isShuffleQuestions: homework.isShuffleQuestions || false,
        isShuffleAnswers: homework.isShuffleAnswers || false
      };

      // Merge với pendingSettings
      const finalSettings = {
        ...currentSettings,
        ...pendingSettings
      };

      console.log('Final settings to save:', finalSettings);
      await updateHomeworkSettings(homework.id, finalSettings);
      
      toast.success('Lưu tất cả thay đổi thành công!');
      router.push(`/class/${classId}/homework/list`);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu thay đổi');
      console.error('Error saving changes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Step 1: Tùy Chỉnh Đáp Án
        if (homework.type === 'original' || homework.type === null) {
          return (
            <QuestionCardGrid
              questions={questions.map(q => ({
                id: q.id,
                questionNumber: q.questionNumber || 0,
                content: q.content || '',
                answer: q.answer,
                point: q.point || 0,
                options: q.options,
                questionType: q.questionType || 'manual'
              }))}
              onQuestionsChange={handleQuestionsUpdate}
              isLoading={false}
              readOnlyNumQuestions={false}
            />
          );
        } else {
          return (
            <ExtractedQuestionEditGrid
              questions={questions}
              onQuestionsChange={handleQuestionsUpdate}
              isLoading={false}
            />
          );
        }
      
      case 2:
        // Step 2: Cài Đặt
        // Function to format Date for datetime-local input
        const formatDateForInput = (date: Date | null) => {
          if (!date) return '';
          const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
          return localDate.toISOString().slice(0, 16);
        };

        return (
          <HomeworkSettings
            currentData={{
              title: homework.title,
              startTime: formatDateForInput(homework.startTime),
              endTime: formatDateForInput(homework.endTime),
              duration: homework.duration || 60,
              maxAttempts: homework.maxAttempts || 1,
              studentViewPermission: homework.studentViewPermission,
              blockViewAfterSubmit: homework.blockViewAfterSubmit,
              gradingMethod: homework.gradingMethod,
              isShuffleQuestions: homework.isShuffleQuestions || false,
              isShuffleAnswers: homework.isShuffleAnswers || false
            }}
            type={homework.type === 'extracted' ? 'extracted' : 'original'}
            isEditMode={true}
            onChange={handleSettingsUpdate}
            isLoading={isLoading}
            disabled={false}
          />
        );
      
      default:
        return null;
    }
  };

  const renderFilePreview = () => {
    if ((homework.type === 'original' || homework.type === null) && homework.originalFileUrl) {
      return (
        <div className="h-full p-4">
          <FileViewer
            fileUrl={homework.originalFileUrl}
            fileName={homework.originalFileName || 'Đề bài'}
          />
        </div>
      );
    } else {
      return (
        <div className="h-full p-4 overflow-y-auto">
          {questions.map((question, index) => (
            <div key={question.id} className="mb-4 p-3 bg-gray-50 rounded border">
              <h4 className="font-medium mb-2">Câu {question.questionNumber || (index + 1)}</h4>
              <p className="mb-2">{question.content || 'Nội dung câu hỏi'}</p>
              {question.options && Array.isArray(question.options) && (
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {question.options.map((option: string, idx: number) => (
                    <li key={idx} className={option.charAt(0) === question.answer ? 'text-green-600 font-medium' : ''}>
                      {option}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-sm text-gray-600 mt-2">Điểm: {question.point || 0}</p>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Fixed Header */}
      <div className="w-full bg-white p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chỉnh Sửa Bài Tập</h1>
            <p className="text-gray-600 mt-1">{homework.title} - {homework.class?.title || homework.class?.name || 'Unknown Class'}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Quay Lại
          </button>
        </div>
      </div>

      {/* Fixed Progress Steps */}
      <div className="bg-white p-4 border-b">
        <div className="flex items-center justify-center space-x-8">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer transition-colors ${
                    currentStep === step.number
                      ? 'bg-blue-600 text-white'
                      : currentStep > step.number
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  onClick={() => setCurrentStep(step.number)}
                >
                  {currentStep > step.number ? '✓' : step.number}
                </div>
                <div className="ml-3 text-left">
                  <p className={`text-sm font-medium ${currentStep === step.number ? 'text-blue-600' : 'text-gray-900'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-px mx-4 ${currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Column 1: File Preview - Large, Fixed */}
        <div className="w-1/2 bg-white border-r flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold">
              {(homework.type === 'original' || homework.type === null) ? 'File Bài Tập' : 'Câu Hỏi Đã Tách'}
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            {renderFilePreview()}
          </div>
        </div>

        {/* Column 2: Edit Content - Scrollable */}
        <div className="flex-1 bg-white flex flex-col border-r">
          <div className="p-4 bg-blue-500 text-white flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {currentStep === 1 ? 'Tùy Chỉnh Đáp Án' : 'Cài Đặt Bài Tập'}
            </h2>
            {hasUnsavedChanges && (
              <span className="text-sm bg-orange-500 px-2 py-1 rounded">
                Chưa lưu thay đổi
              </span>
            )}
          </div>
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              {renderStepContent()}
            </div>
          </div>

          {/* Fixed Navigation */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Quay Lại
              </button>
              
              {currentStep < steps.length ? (
                <button
                  onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tiếp Theo
                </button>
              ) : (
                <button
                  onClick={saveAllChanges}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {isLoading ? 'Đang lưu...' : 'Hoàn Thành'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}