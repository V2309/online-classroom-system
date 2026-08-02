"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import HomeworkFileUpload from "@/components/HomeworkFileUpload";
import Image from "next/image";

interface EssayQuestion {
  question_number: number;
  question_text: string;
  suggested_answer: string;
}

interface EssayGenerationData {
  success: boolean;
  questions: EssayQuestion[];
  total_questions: number;
  source_type: 'file' | 'topic';
  source_name: string; // filename or topic
  originalFile?: {
    url?: string;
    name: string;
    type: string;
    size: number;
  };
}

export default function EssayGenerationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const classId = params.id;
  
  const [mode, setMode] = useState<'select' | 'file' | 'topic'>('select');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");
  
  // State cho topic mode
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);

  const handleFileSelect = async (selectedFile: File, fileUrl: string) => {
    setIsGenerating(true);
    setError("");

    try {
      // Bước 1: Upload tài liệu để tạo session (sử dụng API có sẵn)
      const uploadFormData = new FormData();
      uploadFormData.append('files', selectedFile);

      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/upload-documents`, {
        method: 'POST',
        body: uploadFormData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || "Không thể upload file");
      }

      // Bước 2: Tạo câu hỏi tự luận từ session
      const essayResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/generate-essay-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: uploadResult.session_id,
          num_questions: numQuestions,
        }),
      });

      const essayResult = await essayResponse.json();

      if (essayResult.success) {
        // Lưu dữ liệu vào localStorage
        const essayData: EssayGenerationData = {
          success: true,
          questions: essayResult.questions,
          total_questions: essayResult.questions.length,
          source_type: 'file',
          source_name: selectedFile.name,
          originalFile: {
            url: fileUrl,
            name: selectedFile.name,
            type: selectedFile.type,
            size: selectedFile.size,
          }
        };
        
        localStorage.setItem('generatedEssay', JSON.stringify(essayData));
        
        // Chuyển hướng đến trang create essay
        router.push(`/class/${classId}/homework/add/create?type=essay`);
      } else {
        setError(essayResult.message || "Có lỗi xảy ra khi tạo câu hỏi tự luận");
      }
    } catch (err) {
      setError("Không thể kết nối đến server. Vui lòng thử lại.");
      console.error("Essay generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTopicGeneration = async () => {
    if (!topic.trim()) {
      setError("Vui lòng nhập chủ đề");
      return;
    }

    if (numQuestions < 1 || numQuestions > 20) {
      setError("Số lượng câu hỏi phải từ 1 đến 20");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const essayResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/generate-essay-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          num_questions: numQuestions,
        }),
      });

      const essayResult = await essayResponse.json();

      if (essayResult.success) {
        // Lưu dữ liệu vào localStorage
        const essayData: EssayGenerationData = {
          success: true,
          questions: essayResult.questions,
          total_questions: essayResult.questions.length,
          source_type: 'topic',
          source_name: topic.trim(),
        };
        
        localStorage.setItem('generatedEssay', JSON.stringify(essayData));
        
        // Chuyển hướng đến trang create essay
        router.push(`/class/${classId}/homework/add/create?type=essay`);
      } else {
        setError(essayResult.message || "Có lỗi xảy ra khi tạo câu hỏi tự luận");
      }
    } catch (err) {
      setError("Không thể kết nối đến server. Vui lòng thử lại.");
      console.error("Topic essay generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileError = (errorMessage: string) => {
    setError(errorMessage);
    setIsGenerating(false);
  };

  return (
    <div className="w-full mx-auto h-full">
      <div className="flex flex-col h-full">
        <div className="w-full bg-white p-4 rounded-lg mb-4">
          <Breadcrumb
            items={[
              { label: "Bài tập", href: `/class/${params.id}/homework/list` },
              { label: "Chọn dạng đề", href: `/class/${params.id}/homework/add` },
              { label: "Tạo tự luận", active: true }
            ]}
          />
        </div>

        <div className="bg-white flex-1 px-4 py-8 overflow-y-auto">
          {mode === 'select' && (
            <>
              <h1 className="text-2xl font-bold mb-6 text-center">Tạo câu hỏi tự luận bằng AI</h1>
              
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Từ file PDF */}
                  <div
                    className="border-2 border-blue-500 bg-white rounded-lg p-8 flex flex-col items-center cursor-pointer hover:shadow-lg transition"
                    onClick={() => setMode('file')}
                  >
                    <div className="w-[80px] h-[80px] bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-lg mt-4 mb-2">Từ file PDF</h3>
                    <p className="text-center text-gray-500 mb-4">AI sẽ đọc và tạo câu hỏi tự luận từ nội dung file PDF của bạn</p>
                    <button className="bg-blue-500 text-white px-6 py-2 rounded font-bold">Tải file lên</button>
                  </div>

                  {/* Từ chủ đề */}
                  <div
                    className="border-2 border-green-500 bg-white rounded-lg p-8 flex flex-col items-center cursor-pointer hover:shadow-lg transition"
                    onClick={() => setMode('topic')}
                  >
                    <div className="w-[80px] h-[80px] bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-lg mt-4 mb-2">Từ chủ đề</h3>
                    <p className="text-center text-gray-500 mb-4">Nhập chủ đề và AI sẽ tạo câu hỏi tự luận phù hợp</p>
                    <button className="bg-green-500 text-white px-6 py-2 rounded font-bold">Nhập chủ đề</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {mode === 'file' && (
            <>
              <div className="flex items-center mb-6">
                <button
                  onClick={() => setMode('select')}
                  className="text-gray-500 hover:text-gray-700 mr-4"
                >
                  ← Quay lại
                </button>
                <h1 className="text-2xl font-bold">Tạo tự luận từ file PDF</h1>
              </div>
              
              <div className="max-w-2xl mx-auto">
                {/* Số lượng câu hỏi */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng câu hỏi
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-24"
                  />
                  <span className="text-gray-500 text-sm ml-2">(1-20 câu)</span>
                </div>

                <HomeworkFileUpload
                  onFileSelect={handleFileSelect}
                  onError={handleFileError}
                  isLoading={isGenerating}
                  label="Chọn file PDF để tạo câu hỏi tự luận"
                  className="mb-6"
                  accept=".pdf"
                />

                {/* Hiển thị trạng thái xử lý */}
                {isGenerating && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <div>
                        <p className="text-blue-800 font-medium">Đang tạo câu hỏi tự luận...</p>
                        <p className="text-blue-600 text-sm">AI đang phân tích file và tạo câu hỏi, vui lòng đợi</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hiển thị lỗi */}
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {mode === 'topic' && (
            <>
              <div className="flex items-center mb-6">
                <button
                  onClick={() => setMode('select')}
                  className="text-gray-500 hover:text-gray-700 mr-4"
                >
                  ← Quay lại
                </button>
                <h1 className="text-2xl font-bold">Tạo tự luận từ chủ đề</h1>
              </div>
              
              <div className="max-w-2xl mx-auto">
                <div className="space-y-6">
                  {/* Chủ đề */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chủ đề <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Ví dụ: Kiến trúc máy tính, Mạng máy tính, Cấu trúc dữ liệu..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      disabled={isGenerating}
                    />
                  </div>

                  {/* Số lượng câu hỏi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số lượng câu hỏi
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                      className="border border-gray-300 rounded-lg px-3 py-2 w-24"
                      disabled={isGenerating}
                    />
                    <span className="text-gray-500 text-sm ml-2">(1-20 câu)</span>
                  </div>

                  {/* Nút tạo */}
                  <div className="pt-4">
                    <button
                      onClick={handleTopicGeneration}
                      disabled={isGenerating || !topic.trim()}
                      className="w-full bg-green-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {isGenerating ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Đang tạo câu hỏi...
                        </div>
                      ) : (
                        `Tạo ${numQuestions} câu hỏi tự luận`
                      )}
                    </button>
                  </div>

                  {/* Hiển thị lỗi */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700">{error}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}