"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createHomeworkWithQuestions } from '@/lib/actions/actions';
import Breadcrumb from "@/components/Breadcrumb";
import HomeworkFileUpload from "@/components/HomeworkFileUpload";
import FileViewer from "@/components/FileViewer";
import HomeworkSettings from "@/components/HomeworkSettings";
import QuestionCardGrid from "@/components/QuestionCardGrid";
import { useHomeworkForm } from "@/hooks/useHomeworkForm";

export default function AddHomeworkPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const classId = params.id;
  
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [numQuestions, setNumQuestions] = useState<number>(1);
  const [answers, setAnswers] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const {
    formData,
    updateFormData,
    validationErrors,
    validateForm,
    calculateQuestionPoints
  } = useHomeworkForm();

  const handleFileSelect = (selectedFile: File, url: string) => {
    setFile(selectedFile);
    setFileUrl(url);
    setError('');
    updateFormData({ title: `Bài tập từ ${selectedFile.name}` });
    setIsUploading(false);
    
    // Tự động chuyển sang step 2 (tùy chỉnh đáp án) sau khi upload thành công
    setStep(2);
  };

  const handleFileError = (errorMessage: string) => {
    setError(errorMessage);
    setIsUploading(false);
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
      console.log(`Updated answer ${index} to '${value}':`, newAnswers);
      return newAnswers;
    });
  };

  const handleBulkAnswerChange = (newAnswers: string[]) => {
    console.log("Bulk setting answers:", newAnswers);
    setAnswers(newAnswers);
  };

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const points = parseInt(e.target.value) || 0;
    updateFormData({ points });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (!file || !fileUrl) throw new Error('Vui lòng chọn file bài tập');
      
      // Validate form
      if (!validateForm({ classCode: classId, numQuestions })) {
        throw new Error('Vui lòng kiểm tra lại thông tin đã nhập');
      }

      // Tạo questions với điểm số
      const questionsWithPoints = calculateQuestionPoints(numQuestions, formData.points);
      
      // Gán đáp án
      questionsWithPoints.forEach((q, index) => {
        q.answer = answers[index] || '';
      });

      await createHomeworkWithQuestions({
        class_code: classId,
        fileUrl: fileUrl, // File đã được upload lên S3
        fileName: file.name,
        fileType: file.type,
        points: formData.points,
        questions: questionsWithPoints,
        title: formData.title,
        duration: formData.duration,
        startTime: formData.startTime,
        deadline: formData.endTime,
        attempts: formData.maxAttempts,
        studentViewPermission: formData.studentViewPermission,
        blockViewAfterSubmit: formData.blockViewAfterSubmit,
        gradingMethod: formData.gradingMethod
      });
      
      router.push(`/class/${classId}/homework/list`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto h-full">
      <div className="flex flex-col h-full">
        <div className="w-full bg-white p-4 rounded-lg mb-4">
          <Breadcrumb
            items={[
              { label: "Bài tập", href: `/class/${classId}/homework/list` },
              { label: "Chọn dạng đề", href: `/class/${classId}/homework/add` },
              { label: "Tạo từ file gốc", active: true }
            ]}
          />
        </div>

        <div className="bg-white flex-1 px-4 overflow-y-auto">
          {step === 1 ? (
            // Step 1: Upload File
            <>
              <h1 className="text-2xl font-bold mb-6 text-center">Tải File Lên</h1>
              
              <div className="max-w-2xl mx-auto">
                <HomeworkFileUpload
                  onFileSelect={handleFileSelect}
                  onError={handleFileError}
                  isLoading={isUploading}
                  label="Chọn file để tạo bài tập"
                  className="mb-6"
                />

                {/* Hiển thị lỗi */}
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {/* Nút quay lại */}
                <div className="mt-8 text-center">
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => router.back()}
                  >
                    ← Quay lại chọn dạng đề
                  </button>
                </div>
              </div>
            </>
          ) : step === 2 ? (
            // Step 2: Customize Answers
            <>

                 <div className="mt-4 flex gap-4 align-items-end justify-end">
                    <button
                      type="button"
                      className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
                      onClick={() => setStep(1)}
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                      onClick={() => setStep(3)}
                    >
                      Tiếp theo
                    </button>
                  </div>
              <h1 className="text-2xl font-bold mb-6 text-center">Tùy Chỉnh Đáp Án</h1>
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bên trái: File preview */}
                <div className="border rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-4">File Bài Tập</h2>
                  <FileViewer 
                    fileUrl={fileUrl} 
                    fileName={file?.name}
                    className="mt-4"
                  />
                </div>

                {/* Bên phải: Tùy chỉnh đáp án */}
                <div className="border rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-4">Câu Hỏi</h2>
                  
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
              </div>
            </>
          ) : (
            // Step 3: Homework Settings
            <>
              <h1 className="text-2xl font-bold mb-6 text-center">Cài Đặt Bài Tập</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bên trái: File preview */}
                <div className="border rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-4">File Bài Tập</h2>
                  <FileViewer 
                    fileUrl={fileUrl} 
                    fileName={file?.name}
                    className="mt-4"
                  />
                </div>

                {/* Bên phải: Cài đặt homework */}
                <div className="border rounded-lg p-4">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <h2 className="text-lg font-semibold mb-4">Cài Đặt Bài Tập</h2>
                    
                    <HomeworkSettings
                      data={formData}
                      onChange={updateFormData}
                      validationErrors={validationErrors}
                      disabled={isLoading}
                      type="original"
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
                        disabled={isLoading}
                      >
                        Quay lại
                      </button>
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        disabled={isLoading}
                      >
                        {isLoading && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        {isLoading ? 'Đang tạo...' : 'Tạo bài tập'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}