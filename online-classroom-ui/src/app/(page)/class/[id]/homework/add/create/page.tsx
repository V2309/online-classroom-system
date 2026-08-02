"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createHomeworkFromExtractedQuestions, createHomeworkFromEssayQuestions } from "@/lib/actions/actions";
import Breadcrumb from "@/components/Breadcrumb";
import HomeworkSettings from "@/components/HomeworkSettings";
import QuestionCardGrid from "@/components/QuestionCardGrid";
import ExtractedQuestionGrid from "@/components/ExtractedQuestionGrid";
import EssayQuestionGrid from "@/components/EssayQuestionGrid";
import { useHomeworkForm } from "@/hooks/useHomeworkForm";

interface QuizQuestion {
  question_number: number;
  question_text: string;
  options: string[];
  correct_answer_char: string;
  correct_answer_index: number;
}

interface QuizData {
  success: boolean;
  filename: string;
  quiz_data: QuizQuestion[];
  total_questions: number;
  originalFile?: {
    url?: string; // URL S3 sau khi upload
    name: string;
    type: string;
    size: number;
  };
}

interface EssayQuestion {
  question_number: number;
  question_text: string;
  suggested_answer: string;
}

interface EssayData {
  success: boolean;
  questions: EssayQuestion[];
  total_questions: number;
  source_type: 'file' | 'topic';
  source_name: string;
  originalFile?: {
    url?: string;
    name: string;
    type: string;
    size: number;
  };
}

export default function CreateHomeworkPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = params.id;
  const type = searchParams?.get('type');
  
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [essayData, setEssayData] = useState<EssayData | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string>("");
  

  
  // Sử dụng hook giống trang original
  const {
    formData,
    updateFormData,
    validationErrors,
    validateForm,
    calculateQuestionPoints
  } = useHomeworkForm();
  
  // State cho câu hỏi và đáp án
  const [numQuestions, setNumQuestions] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (type === 'extracted') {
      const savedData = localStorage.getItem('extractedQuiz');
      if (savedData) {
        const data = JSON.parse(savedData);
        setQuizData(data);
        
        updateFormData({ title: `Bài tập từ ${data.filename}` });
        
        // Chọn tất cả câu hỏi mặc định
        const questionNumbers = data.quiz_data
          .filter((item: any) => typeof item.question_number === 'number')
          .map((item: any) => item.question_number);
        setSelectedQuestions(questionNumbers);
        
        // Thiết lập số lượng câu hỏi và đáp án
        setNumQuestions(questionNumbers.length);
        const initialAnswers = Array(questionNumbers.length).fill('');
        questionNumbers.forEach((qNum: number, index: number) => {
          const question = data.quiz_data.find((q: any) => q.question_number === qNum);
          if (question && question.correct_answer_char) {
            initialAnswers[index] = question.correct_answer_char;
          }
        });
        setAnswers(initialAnswers);
        
        // Chuyển thẳng đến step 2 (tùy chỉnh đáp án) thay vì step 1
        setStep(2);
      }
    } else if (type === 'essay') {
      const savedData = localStorage.getItem('generatedEssay');
      if (savedData) {
        const data = JSON.parse(savedData);
        setEssayData(data);
        
        const titlePrefix = data.source_type === 'file' 
          ? `Tự luận từ ${data.source_name}` 
          : `Tự luận: ${data.source_name}`;
        updateFormData({ title: titlePrefix });
        
        // Chọn tất cả câu hỏi mặc định
        const questionNumbers = data.questions.map((q: EssayQuestion) => q.question_number);
        setSelectedQuestions(questionNumbers);
        
        // Thiết lập cho essay không cần đáp án trắc nghiệm
        setNumQuestions(data.questions.length);
        setAnswers([]); // Essay không cần đáp án trắc nghiệm
        
        // Chuyển thẳng đến step 2
        setStep(2);
      }
    }
  }, [type,updateFormData]);

  const toggleQuestionSelection = (questionNumber: number) => {
    setSelectedQuestions(prev => 
      prev.includes(questionNumber)
        ? prev.filter(num => num !== questionNumber)
        : [...prev, questionNumber]
    );
  };

  const selectAllQuestions = () => {
    if (quizData) {
      const allQuestions = quizData.quiz_data
        .filter((item: any) => typeof item.question_number === 'number')
        .map((item: any) => item.question_number);
      setSelectedQuestions(allQuestions);
    } else if (essayData) {
      const allQuestions = essayData.questions.map((q: EssayQuestion) => q.question_number);
      setSelectedQuestions(allQuestions);
    }
  };

  const deselectAllQuestions = () => {
    setSelectedQuestions([]);
  };

  const handleNumQuestionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value) || 1;
    setNumQuestions(num);
    setAnswers(prev => {
      const newAnswers = new Array(num).fill('');
      // Copy existing answers if available
      for (let i = 0; i < Math.min(prev.length, num); i++) {
        newAnswers[i] = prev[i] || '';
      }
      return newAnswers;
    });
  };

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[index] = value;
      return newAnswers;
    });
  };

  const handleBulkAnswerChange = (newAnswers: string[]) => {
    setAnswers(newAnswers);
  };

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const points = parseInt(e.target.value) || 0;
    updateFormData({ points });
  };

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    
    try {
      if (!quizData && !essayData) throw new Error('Vui lòng chọn dữ liệu bài tập');
      
      // Validate form
      if (!validateForm({ classCode: classId, numQuestions })) {
        throw new Error('Vui lòng kiểm tra lại thông tin đã nhập');
      }
      
      if (type === 'extracted' && quizData) {
        // Xử lý cho trắc nghiệm
        let originalFileUrl = quizData.originalFile?.url;
        
        // File đã được upload lên S3 từ trang auto
        if (!originalFileUrl) {
          throw new Error('Không tìm thấy file đã upload');
        }
        
        // Chuẩn bị dữ liệu từ quiz_data gốc
        let processedQuizData = [...quizData.quiz_data];

        // Nếu có bật đảo, gọi API Flask để xử lý
        if (formData.isShuffleQuestions || formData.isShuffleAnswers) {
          const shuffleResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/shuffle-quiz`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quiz_data: processedQuizData,
              shuffle_questions: formData.isShuffleQuestions,
              shuffle_answers: formData.isShuffleAnswers,
            }),
          });

          if (!shuffleResponse.ok) {
            throw new Error('Không thể đảo đề thi');
          }

          const shuffleResult = await shuffleResponse.json();
          if (shuffleResult.success) {
            processedQuizData = shuffleResult.quiz_data;
          }
        }

        // Tạo questions với điểm số
        const questionsWithPoints = calculateQuestionPoints(numQuestions, formData.points);
        
        const extractedQuestions = answers.map((answer, index) => {
          const originalQuestion = processedQuizData[index];
          
          return {
            question_number: index + 1,
            question_text: originalQuestion?.question_text || `Câu ${index + 1}`,
            options: originalQuestion?.options || [],
            correct_answer_char: originalQuestion?.correct_answer_char || answer,
            correct_answer_index: originalQuestion?.correct_answer_index || 0,
            point: questionsWithPoints[index]?.point || 0,
          };
        });

        // Gọi function mới cho homework dạng extracted
        await createHomeworkFromExtractedQuestions({
          title: formData.title,
          class_code: classId,
          originalFileUrl,
          originalFileName: quizData.originalFile?.name,
          originalFileType: quizData.originalFile?.type,
          extractedQuestions,
          duration: formData.duration,
          startTime: formData.startTime,
          deadline: formData.endTime,
          attempts: formData.maxAttempts,
          studentViewPermission: formData.studentViewPermission,
          blockViewAfterSubmit: formData.blockViewAfterSubmit,
          gradingMethod: formData.gradingMethod,
          isShuffleQuestions: formData.isShuffleQuestions,
          isShuffleAnswers: formData.isShuffleAnswers,
        });
        
        // Xóa dữ liệu đã lưu
        localStorage.removeItem('extractedQuiz');
        
      } else if (type === 'essay' && essayData) {
        // Xử lý cho tự luận
        // Tạo questions với điểm số
        const questionsWithPoints = calculateQuestionPoints(numQuestions, formData.points);
        
        const selectedEssayQuestions = essayData.questions
          .filter(q => selectedQuestions.includes(q.question_number))
          .map((q, index) => ({
            question_number: index + 1,
            question_text: q.question_text,
            suggested_answer: q.suggested_answer,
            point: questionsWithPoints[index]?.point || 0,
          }));

        // Gọi function mới cho homework dạng essay
        await createHomeworkFromEssayQuestions({
          title: formData.title,
          class_code: classId,
          originalFileUrl: essayData.originalFile?.url,
          originalFileName: essayData.originalFile?.name,
          originalFileType: essayData.originalFile?.type,
          essayQuestions: selectedEssayQuestions,
          source_type: essayData.source_type,
          source_name: essayData.source_name,
          duration: formData.duration,
          startTime: formData.startTime,
          deadline: formData.endTime,
          attempts: formData.maxAttempts,
          studentViewPermission: formData.studentViewPermission,
          blockViewAfterSubmit: formData.blockViewAfterSubmit,
          gradingMethod: formData.gradingMethod,
        });
        
        // Xóa dữ liệu đã lưu
        localStorage.removeItem('generatedEssay');
      }
      
      // Chuyển về danh sách bài tập
      router.push(`/class/${classId}/homework/list`);
      
    } catch (error) {
      console.error('Error creating homework:', error);
      setError('Có lỗi xảy ra khi tạo bài tập: ' + (error instanceof Error ? error.message : ''));
    } finally {
      setIsCreating(false);
    }
  };

  if (!quizData && !essayData) {
    return (
      <div className="w-full mx-auto h-full">
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-lg text-gray-600">Không có dữ liệu bài tập</p>
          <button 
            onClick={() => router.push(`/class/${classId}/homework/add`)}
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto h-full">
      <div className="flex flex-col h-full">
        <div className="w-full bg-white p-4 rounded-lg mb-4">
          <Breadcrumb
            items={[
              { label: "Bài tập", href: `/class/${classId}/homework/list` },
              { label: "Chọn dạng đề", href: `/class/${classId}/homework/add` },
              ...(type === 'essay' 
                ? [{ label: "Tạo tự luận", href: `/class/${classId}/homework/add/essay` }]
                : [{ label: "Tách câu tự động", href: `/class/${classId}/homework/add/auto` }]
              ),
              { label: "Tạo bài tập", active: true }
            ]}
          />
        </div>

        <div className="bg-white flex-1 px-4 py-8 overflow-y-auto">
          {type === 'essay' ? (
            // Essay Questions Flow - Chỉ có Step 2 (Settings)
            <>
              <h1 className="text-2xl font-bold mb-6 text-center">Tạo Bài Tập Tự Luận</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bên trái: Danh sách câu hỏi tự luận */}
                <div className="border rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-4">
                    Câu Hỏi Tự Luận ({essayData?.total_questions} câu)
                  </h2>
                  <p className="text-gray-600 text-sm mb-4">
                    {essayData?.source_type === 'file' 
                      ? `Được tạo từ file: ${essayData.source_name}`
                      : `Chủ đề: ${essayData?.source_name}`
                    }
                  </p>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    Đã chọn: <span className="font-bold text-green-600">{selectedQuestions.length}</span> câu
                  </div>

                  <EssayQuestionGrid
                    questions={essayData?.questions || []}
                    selectedQuestions={selectedQuestions}
                    onToggleQuestion={toggleQuestionSelection}
                    className="max-h-[600px] overflow-y-auto"
                  />

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllQuestions}
                      className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                    >
                      Chọn tất cả
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllQuestions}
                      className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                </div>

                {/* Bên phải: Cài đặt homework */}
                <div className="border rounded-lg p-4">
                  <form onSubmit={handleCreateHomework} className="space-y-6">
                    <h2 className="text-lg font-semibold mb-4">Cài Đặt Bài Tập</h2>
                    
                    <HomeworkSettings
                      data={formData}
                      onChange={updateFormData}
                      validationErrors={validationErrors}
                      disabled={isCreating}
                      type="essay"
                    />

                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700">{error}</p>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        type="button"
                        className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
                        onClick={() => router.back()}
                        disabled={isCreating}
                      >
                        Quay lại
                      </button>
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        disabled={isCreating || selectedQuestions.length === 0}
                      >
                        {isCreating && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        {isCreating ? 'Đang tạo...' : `Tạo bài tập (${selectedQuestions.length} câu)`}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          ) : (
            // Quiz Questions Flow - 3 Steps
            step === 1 ? (
              // Step 1: Review Extracted Questions  
              <>
                <h1 className="text-2xl font-bold mb-6 text-center">Xem Lại Câu Hỏi Đã Tách</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Bên trái: Danh sách câu hỏi đã tách */}
                  <ExtractedQuestionGrid
                    questions={quizData?.quiz_data || []}
                    selectedQuestions={selectedQuestions}
                    onToggleQuestion={toggleQuestionSelection}
                    onSelectAll={selectAllQuestions}
                    onDeselectAll={deselectAllQuestions}
                  />

                  {/* Bên phải: Thông tin file */}
                  <div className="border rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-4">Thông Tin File</h2>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium text-gray-700">
                          {quizData?.originalFile?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Tổng số câu hỏi: <span className="font-bold text-blue-600">{quizData?.total_questions}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Đã chọn: <span className="font-bold text-green-600">{selectedQuestions.length}</span> câu
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-4 justify-center">
                  <button
                    type="button"
                    className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
                    onClick={() => router.back()}
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    onClick={() => setStep(2)}
                    disabled={selectedQuestions.length === 0}
                  >
                    Tùy chỉnh đáp án ({selectedQuestions.length} câu)
                  </button>
                </div>
              </>
            ) : step === 2 ? (
              // Step 2: Customize Answers - Layout như trong ảnh
              <>
                <h1 className="text-2xl font-bold mb-6 text-center">Tạo Bài Tập Từ Câu Hỏi Đã Tách</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Bên trái: Danh sách câu hỏi đã tách (như trong ảnh) */}
                  <div className="border rounded-lg p-4 bg-red-50 border-red-300">
                    <h2 className="text-lg font-semibold mb-4 text-red-700">Câu Hỏi Đã Tách ({quizData?.total_questions} câu)</h2>
                    <p className="text-red-600 text-sm mb-4 font-medium">
                      Các câu hỏi đã được tách từ file đề thi
                    </p>
                    
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                      {quizData?.quiz_data
                        .filter((item: any) => typeof item.question_number === 'number')
                        .map((question: any, index: number) => (
                          <div 
                            key={index}
                            className={`border rounded-lg p-4 bg-white ${
                              selectedQuestions.includes(question.question_number)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedQuestions.includes(question.question_number)}
                                onChange={() => toggleQuestionSelection(question.question_number)}
                                className="mt-1 w-4 h-4 text-blue-600"
                              />
                              <div className="flex-1">
                                <h4 className="font-bold text-base mb-2">
                                  {question.question_text}
                                </h4>
                                
                                <div className="space-y-1 text-sm">
                                  {question.options?.map((option: string, optIndex: number) => {
                                    const optionLabel = String.fromCharCode(65 + optIndex);
                                    const isCorrect = question.correct_answer_char === optionLabel ||
                                      (option && question.correct_answer_char && option.trim().startsWith(question.correct_answer_char));
                                    
                                    return (
                                      <div 
                                        key={optIndex}
                                        className={`p-2 rounded ${isCorrect ? 'bg-green-100 text-green-800 font-medium' : 'bg-gray-50 text-gray-700'}`}
                                      >
                                        {option.trim().match(/^[A-D]\./i) ? option : `${optionLabel}. ${option}`}
                                        {isCorrect && (
                                          <span className="ml-2 text-green-600 font-bold">(Đáp án)</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Bên phải: Tùy chỉnh đáp án */}
                  <QuestionCardGrid
                    numQuestions={numQuestions}
                    answers={answers}
                    totalPoints={formData.points}
                    onNumQuestionsChange={handleNumQuestionsChange}
                    onAnswerChange={handleAnswerChange}
                    onPointsChange={handlePointsChange}
                    onBulkAnswerChange={handleBulkAnswerChange}
                  />
                </div>

                {/* Thông báo trạng thái đảo */}
                {(formData.isShuffleQuestions || formData.isShuffleAnswers) && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium mb-1">⚠️ Chế độ đảo đề đã được bật:</p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {formData.isShuffleQuestions && <li>• Thứ tự câu hỏi sẽ được đảo ngẫu nhiên</li>}
                      {formData.isShuffleAnswers && <li>• Thứ tự đáp án sẽ được đảo ngẫu nhiên</li>}
                    </ul>
                  </div>
                )}

                <div className="mt-6 flex gap-4 justify-center">
                  <button
                    type="button"
                    className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
                    onClick={() => router.back()}
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    onClick={() => setStep(3)}
                  >
                    Cài đặt bài tập
                  </button>
                </div>
              </>
            ) : (
              // Step 3: Homework Settings
              <>
                <h1 className="text-2xl font-bold mb-6 text-center">Cài Đặt Bài Tập</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Bên trái: Câu hỏi đã tách (hiển thị trong phần cài đặt như yêu cầu) */}
                  <ExtractedQuestionGrid
                    questions={quizData?.quiz_data || []}
                    selectedQuestions={selectedQuestions}
                    onToggleQuestion={toggleQuestionSelection}
                    onSelectAll={selectAllQuestions}
                    onDeselectAll={deselectAllQuestions}
                  />

                  {/* Bên phải: Cài đặt homework */}
                  <div className="border rounded-lg p-4">
                    <form onSubmit={handleCreateHomework} className="space-y-6">
                      <h2 className="text-lg font-semibold mb-4">Cài Đặt Bài Tập</h2>
                      
                      <HomeworkSettings
                        data={formData}
                        onChange={updateFormData}
                        validationErrors={validationErrors}
                        disabled={isCreating}
                        type="extracted"
                      />

                      {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-700">{error}</p>
                        </div>
                      )}

                      <div className="flex gap-4">
                        <button
                          type="button"
                          className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
                          onClick={() => setStep(2)}
                          disabled={isCreating}
                        >
                          Quay lại
                        </button>
                        <button
                          type="submit"
                          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                          disabled={isCreating}
                        >
                          {isCreating && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          )}
                          {isCreating ? 'Đang tạo...' : 'Tạo bài tập'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}