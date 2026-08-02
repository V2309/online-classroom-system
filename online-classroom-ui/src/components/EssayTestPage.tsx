"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Clock, FileText, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";

interface Question {
  id: number;
  content: string;
  point: number;
}

interface EssayTestPageProps {
  homework: {
    id: number;
    title: string;
    description: string;
    duration: number;
    type: string;
    fileUrl?: string;
    fileType?: string;
    fileName?: string;
  };
  questions: Question[];
  duration: number;
  userId: string;
  classCode: string;
  role: string;
}

export function EssayTestPage({
  homework,
  questions,
  duration,
  userId,
  classCode,
  role
}: EssayTestPageProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert minutes to seconds
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/homework/${homework.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          userId,
          timeSpent: (duration * 60) - timeLeft
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Clear saved answers
        localStorage.removeItem(`homework-${homework.id}-answers`);
        
        // Redirect to detail page to show results
        router.push(`/class/${classCode}/homework/${homework.id}/detail?utid=${result.submissionId}`);
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      console.error("Submit failed:", error);
      alert("Nộp bài không thành công. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  }, [isSubmitting, answers, userId, timeLeft, duration, homework.id, classCode, router]);

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit]);

  // Auto-save answers periodically
  useEffect(() => {
    const autoSave = setInterval(() => {
      if (Object.keys(answers).length > 0) {
        // Save to localStorage as backup
        localStorage.setItem(`homework-${homework.id}-answers`, JSON.stringify(answers));
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(autoSave);
  }, [answers, homework.id]);

  // Load saved answers on mount
  useEffect(() => {
    const saved = localStorage.getItem(`homework-${homework.id}-answers`);
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved answers:", e);
      }
    }
  }, [homework.id]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Save progress to backend
      const response = await fetch(`/api/homework/${homework.id}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          userId,
          isPartial: true
        }),
      });

      if (response.ok) {
        // Show success message
        alert("Đã lưu bài làm thành công!");
      }
    } catch (error) {
      console.error("Save failed:", error);
      alert("Lưu bài không thành công. Vui lòng thử lại.");
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Không có câu hỏi nào trong bài tập này.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              
              <h1 className="text-2xl font-bold text-gray-900">{homework.title}</h1>
            
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-lg font-mono">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className={`${timeLeft < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thời gian còn lại</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold text-blue-600 mb-2">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-sm text-gray-600">
                    ngày {new Date().toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Yêu cầu chung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Trả lời các câu hỏi dưới đây để hoàn thành bài tập.
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Thời hạn nộp bài lần</span>
                    <span className="font-medium">{formatTime(timeLeft)}</span>
                  </div>
                </div>

                {homework.fileUrl && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">Tài liệu tham khảo</h4>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <a 
                        href={homework.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex-1"
                      >
                        {homework.fileName || "Tài liệu.pdf"}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Danh sách câu hỏi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`
                        w-10 h-10 rounded text-sm font-medium transition-colors
                        ${currentQuestion === index 
                          ? 'bg-blue-600 text-white' 
                          : answers[questions[index].id]
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Câu hỏi {currentQuestion + 1}
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    {currentQ.point} điểm
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose max-w-none">
                  <p className="text-gray-900 leading-relaxed">
                    {currentQ.content}
                  </p>
                </div>

                <div className="space-y-2">
                  <Textarea
                    placeholder={`Nhập câu trả lời cho câu hỏi ${currentQuestion + 1}...`}
                    value={answers[currentQ.id] || ""}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    className="min-h-[200px] resize-none"
                    maxLength={5000}
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {(answers[currentQ.id] || "").length}/5000 ký tự
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={goToPreviousQuestion}
                      disabled={currentQuestion === 0}
                    >
                      ← Câu trước
                    </Button>
                    <Button
                      variant="outline"
                      onClick={goToNextQuestion}
                      disabled={currentQuestion === questions.length - 1}
                    >
                      Câu tiếp theo →
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleSave}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Lưu bản nháp
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Section */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Tập đình kèm (cho toàn bộ bài tập)
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Nhấn để tải lên tệp và tệp
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="text-gray-600"
                    >
                      Lưu bản nháp
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Đang nộp..." : "Nộp bài"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Progress Info */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-sm">
        <div className="flex items-center gap-4">
          <span>Đã lưu bản nháp lúc {new Date().toLocaleTimeString('vi-VN')}</span>
        </div>
      </div>
    </div>
  );
}