"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import HomeworkFileUpload from "@/components/HomeworkFileUpload";

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
    tempUrl?: string; // URL tạm thời trong public/uploads
    tempPath?: string; // Đường dẫn file tạm thời
    url?: string; // URL S3 sau khi upload
    name: string;
    type: string;
    size: number;
  };
}

export default function AutoExtractPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const classId = params.id;
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFileSelect = async (selectedFile: File, fileUrl: string) => {
    setIsExtracting(true);
    setError("");

    try {
      // Trích xuất câu hỏi qua Flask API
      const extractFormData = new FormData();
      extractFormData.append('file', selectedFile);

      const extractResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/extract-quiz`, {
        method: 'POST',
        body: extractFormData,
      });

      const extractResult = await extractResponse.json();

      if (extractResult.success) {
        // Lưu dữ liệu vào localStorage với file URL từ S3
        const extractedData = {
          ...extractResult,
          originalFile: {
            url: fileUrl, // URL S3 đã upload
            name: selectedFile.name,
            type: selectedFile.type,
            size: selectedFile.size,
          }
        };
        
        localStorage.setItem('extractedQuiz', JSON.stringify(extractedData));
        
        // Chuyển hướng đến trang create
        router.push(`/class/${classId}/homework/add/create?type=extracted`);
      } else {
        setError(extractResult.error || "Có lỗi xảy ra khi xử lý file");
      }
    } catch (err) {
      setError("Không thể kết nối đến server. Vui lòng thử lại.");
      console.error("Processing error:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileError = (errorMessage: string) => {
    setError(errorMessage);
    setIsExtracting(false);
  };

  return (
    <div className="w-full mx-auto h-full">
      <div className="flex flex-col h-full">
        <div className="w-full bg-white p-4 rounded-lg mb-4">
          <Breadcrumb
            items={[
              { label: "Bài tập", href: `/teacher/class/${classId}/homework/list` },
              { label: "Chọn dạng đề", href: `/teacher/class/${classId}/homework/add` },
              { label: "Tách câu tự động", active: true }
            ]}
          />
        </div>

        <div className="bg-white flex-1 px-4 py-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Tải File Lên</h1>
          
          <div className="max-w-2xl mx-auto">
            <HomeworkFileUpload
              onFileSelect={handleFileSelect}
              onError={handleFileError}
              isLoading={isExtracting}
              label="Chọn file để trích xuất câu hỏi tự động"
              className="mb-6"
              accept=".pdf,.docx"
            />

            {/* Hiển thị trạng thái xử lý */}
            {isExtracting && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <div>
                    <p className="text-blue-800 font-medium">Đang trích xuất câu hỏi...</p>
                    <p className="text-blue-600 text-sm">AI đang phân tích file của bạn, vui lòng đợi</p>
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

            {/* Nút quay lại */}
            <div className="mt-8 text-center">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => router.back()}
                disabled={isExtracting}
              >
                ← Quay lại chọn dạng đề
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}