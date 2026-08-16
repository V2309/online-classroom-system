"use client";

// BƯỚC 1: Thêm 'useCallback' vào import
import { useEffect, useState, useRef, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { useRouter } from "next/navigation";
import { useHomeworkSession } from "@/hooks/useHomeworkSession";
import { ExtractedQuestionsView } from "./ExtractedQuestionsView";
import { homeworkService } from "@/services/homework.service";

// ... (Giữ nguyên Interfaces) ...
interface Homework {
  id: number;
  title: string;
  description?: string;
  duration?: number;
  type?: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  fileSize?: number;
  startTime?: string | Date | null;
  endTime?: string | Date | null;
  maxAttempts?: number | null;
}
interface Question {
  id: number;
  content: string;
  options: string[];
  point?: number;
  answer?: string; // Thêm trường đáp án đúng
}
interface ExamTestProps {
  homework?: Homework;
  questions: Question[];
  duration: number; // phút
  userId: string; // ID của người dùng
  classCode: string; // Mã lớp học
  role: string;
}

export function TestHomeWork({
  homework,
  questions,
  duration,
  userId,
  classCode,
  role,
}: ExamTestProps) {
  const router = useRouter();

  // DEBUG: Kiểm tra dữ liệu questions
  console.log("TestHomeWork Debug:", {
    questionsLength: questions.length,
    questions: questions,
    homework: homework
  });

  // === BƯỚC 2: DI CHUYỂN TẤT CẢ HOOKS LÊN ĐẦU ===
  const [submission, setSubmission] = useState<any>(null); // Lưu kết quả bài làm
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // --- THÊM DÒNG NÀY: State đếm số lần chuyển tab ---
  const [violationCount, setViolationCount] = useState(0);

  // --- THÊM ĐOẠN NÀY: Lắng nghe sự kiện chuyển tab ---
  useEffect(() => {
    // 1. Nếu không phải học sinh hoặc đã nộp bài rồi thì không theo dõi
    if (role !== "student" || submission) return;

    const handleVisibilityChange = () => {
      // 2. Nếu trạng thái là hidden (người dùng chuyển tab hoặc minimize)
      if (document.visibilityState === "hidden") {
        setViolationCount((prev) => {
          const newCount = prev + 1;

          // 3. Hiển thị cảnh báo
          toast.warning(
            `CẢNH BÁO: Hệ thống phát hiện bạn rời màn hình! (Lần ${newCount})`,
            {
              position: "top-center",
              autoClose: 4000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: false,
              draggable: false,
              theme: "colored",
            }
          );

          return newCount;
        });
      }
    };

    // 4. Gắn sự kiện
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 5. Gỡ sự kiện khi thoát
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [role, submission]);

  // 1. Function để hiện modal xác nhận
  const handleSubmitClick = useCallback(() => {
    if (!homework) return;

    const currentAnswers =
      role === "teacher" ? answers : sessionDataRef.current?.answers || {};

    // Chỉ validate cho học sinh
    if (role === "student") {
      const questionIds = questions.map((q) => q.id);
      const unanswered = questionIds.filter((id) => !currentAnswers[id]);
      if (unanswered.length > 0) {
        toast.error(`Bạn chưa trả lời các câu: ${unanswered.join(", ")}`);
        return; // Ngăn hiện modal
      }
    }

    // Hiện modal xác nhận
    setShowConfirmModal(true);
  }, [homework, role, answers, questions]);

  // 2. Function thực hiện nộp bài (sau khi xác nhận)
  const handleConfirmSubmit = useCallback(async () => {
    // Phải kiểm tra homework bên trong
    if (!homework) return;

    setShowConfirmModal(false); // Đóng modal

    // Dùng 'sessionDataRef' để lấy giá trị mới nhất
    const currentAnswers =
      role === "teacher" ? answers : sessionDataRef.current?.answers || {};

    console.log({
      homeworkId: homework.id,
      studentId: userId,
      answers: currentAnswers,
      role,
    });

    const timeSpent =
      role === "teacher" ? 0 : sessionDataRef.current?.getTimeSpent() || 0;

    try {
      const result: any = await homeworkService.submitHomework(homework.id, {
        answers: currentAnswers,
        studentId: userId,
        role,
        timeSpent,
        violationCount: role === "student" ? violationCount : 0,
        file: {
          name: homework.fileName,
          type: homework.fileType,
          url: homework.fileUrl,
          size: homework.fileSize || 0,
        },
      });

      if (role === "student" && result?.submissionId) {
        toast.success("Đã nộp bài!");
        sessionDataRef.current?.clearSession(); // Xóa trạng thái
        router.push(
          `/class/${classCode}/homework/${homework.id}/detail?utid=${result.submissionId}`
        );
      } else if (role === "teacher") {
        toast.success("Đã nộp bài!");
        router.push(`/class/${classCode}/homework/list`);
      } else {
        toast.error("Có lỗi xảy ra khi nộp bài.");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Có lỗi xảy ra khi nộp bài.");
      console.error("Submit error:", error);
    }
  }, [homework, role, answers, userId, classCode, router, violationCount]);

  // 2. Gọi useHomeworkSession (luôn gọi, không có điều kiện)
  const sessionData = useHomeworkSession({
    homeworkId: homework?.id || 0,
    duration,
    onTimeUp: handleConfirmSubmit, // Truyền hàm đã bọc
    role,
  });

  // 3. Dùng ref để đảm bảo handleSubmit luôn có sessionData mới nhất
  const sessionDataRef = useRef(sessionData);
  useEffect(() => {
    sessionDataRef.current = sessionData;
  }, [sessionData]);

  // === BƯỚC 3: Câu lệnh `return` sớm ĐẶT Ở ĐÂY (sau các Hook) ===
  if (!homework) {
    return <div>Không tìm thấy bài tập.</div>;
  } // --- Các hàm helper (đặt sau return sớm) ---

  const updateAnswer = (questionId: number, answer: string) => {
    if (role === "teacher") {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    } else {
      sessionData?.updateAnswer(questionId, answer);
    }
  };

  const getAnswers = () => {
    return role === "teacher" ? answers : sessionData?.answers || {};
  };

  const getTimeSpent = () => {
    return role === "teacher" ? 0 : sessionData?.getTimeSpent() || 0;
  };

  const getUnansweredQuestions = (questionIds: number[]) => {
    const currentAnswers = getAnswers();
    return questionIds.filter((id) => !currentAnswers[id]);
  };

  const handleSelect = (qid: number, value: string) => {
    updateAnswer(qid, value);
  };

  const handleInput = (qid: number, value: string) => {
    const v = value
      .toUpperCase()
      .replace(/[^A-D]/g, "")
      .slice(0, 1);
    updateAnswer(qid, v);
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    updateAnswer(questionId, answer);
  };

  const scrollToQuestion = (questionIndex: number) => {
    setCurrent(questionIndex);
    if (homework?.type === "extracted") {
      const questionId = questions[questionIndex].id;
      const questionElement = questionRefs.current[questionId];
      if (questionElement) {
        questionElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };

  // --- BƯỚC 4: SỬA LỖI CSS TRONG JSX ---
  return (
    <div className="flex gap-8 min-h-screen h-screen overflow-hidden">
      {/* Đề bài bên trái */}
      {!submission ? (
        <div className="flex-1 bg-white rounded shadow p-6 h-full ">
          {homework && (
            <div className="mb-6">
              <h2 className="text-xl font-bold">{homework.title}</h2>
              <div className="text-sm text-gray-500 mb-2">
                Thời lượng: {homework.duration || duration} phút
              </div>

              {/* Hiển thị theo loại homework */}
              {homework.type === "extracted" ? (
                // Hiển thị câu hỏi đã tách với callback để cập nhật phiếu trả lời
                <ExtractedQuestionsView
                  questions={questions}
                  onAnswerChange={handleAnswerChange}
                  questionRefs={questionRefs}
                />
              ) : (
                // Hiển thị file PDF/Word gốc (dạng original)
                <div>
                  {homework.fileUrl &&
                    homework.fileType === "application/pdf" && (
                      <div className="border rounded p-2 mb-4 h-[600px] bg-white">
                        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                          <Viewer fileUrl={homework.fileUrl} />
                        </Worker>
                      </div>
                    )}

                  {homework.fileUrl && homework.fileType?.includes("word") && (
                    <div className="border rounded p-4 mb-4 bg-gray-50">
                      <div className="text-center">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold mb-2">
                            Đề thi Word
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Tệp Word không thể hiển thị trực tiếp. Vui lòng tải
                            xuống để xem đề thi.
                          </p>
                        </div>
                        <a
                          href={homework.fileUrl}
                          download={homework.fileName}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-flex items-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Tải xuống đề thi
                        </a>
                      </div>
                    </div>
                  )}

                  {!homework.fileUrl && (
                    <div className="text-center text-gray-500 py-8">
                      Không có file đề thi
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>Hiển thị kết quả bài làm...</div>
      )}

      {/* Phiếu trả lời bên phải */}
      <div className="w-[350px] bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-4 h-full text-foreground">
        {role === "teacher" && (
          <div className="bg-accent/40 border border-border rounded-xl p-3 mb-2">
            <div className="text-primary font-semibold text-sm">
              🎓 Chế độ xem trước (Giáo viên)
            </div>
            <div className="text-muted-foreground text-xs mt-1">
              Không giới hạn thời gian • Kết quả không ảnh hưởng đến học sinh
            </div>
          </div>
        )}
        <div className="font-bold text-primary text-lg mb-2">
          {role === "teacher"
            ? `Thời gian gốc: ${duration} phút`
            : `Thời gian còn lại: ${sessionData?.minutes || 0}:${(
                sessionData?.seconds || 0
              )
                .toString()
                .padStart(2, "0")}`}
        </div>
        {/* Cảnh báo vi phạm */}
        {role === "student" && violationCount > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
            <div className="flex items-center gap-2 text-destructive font-bold text-sm mb-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              CẢNH BÁO GIAN LẬN
            </div>
            <div className="text-destructive text-xs">
              Hệ thống phát hiện bạn đã rời khỏi bài thi <b>{violationCount}</b>{" "}
              lần. Giáo viên sẽ nhận được thông báo này.
            </div>
          </div>
        )}
        <div className="mb-2">
          <div className="font-semibold mb-1 text-foreground">Phiếu trả lời</div>
          <div className="grid grid-cols-5 gap-2 mb-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                className={`w-12 h-12 rounded-lg border text-sm font-semibold transition-colors ${
                  current === idx
                    ? "bg-primary text-primary-foreground border-primary"
                    : getAnswers()[q.id]
                    ? "bg-state-success/20 text-state-success border-state-success/40"
                    : "border-border bg-background text-foreground hover:bg-accent"
                }`}
                onClick={() => scrollToQuestion(idx)}
                type="button"
              >
                {idx + 1} {getAnswers()[q.id] || ""}
              </button>
            ))}
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-foreground">Đáp án câu {current + 1}:</div>
            <div className="flex gap-2 mb-2 flex-wrap">
              {(() => {
                const currentOptions = questions[current]?.options;
                const count =
                  currentOptions && currentOptions.length > 0
                    ? currentOptions.length
                    : 4;

                return Array.from({ length: count }).map((_, index) => {
                  const label = String.fromCharCode(65 + index);
                  const isSelected =
                    getAnswers()[questions[current].id] === label;

                  return (
                    <button
                      key={label}
                      className={`w-10 h-10 border rounded-lg font-bold transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                          : "bg-background text-foreground border-border hover:bg-accent"
                      }`}
                      onClick={() => handleSelect(questions[current].id, label)}
                      type="button"
                    >
                      {label}
                    </button>
                  );
                });
              })()}
            </div>
            <input
              className="border border-input bg-background text-foreground px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Nhập đáp án..."
              value={getAnswers()[questions[current].id] || ""}
              onChange={(e) =>
                handleInput(questions[current].id, e.target.value)
              }
              maxLength={1}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-auto">
          <button
            className="bg-muted hover:bg-accent text-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm"
            onClick={() =>
              window.confirm("Bạn có chắc muốn rời khỏi?") &&
              window.history.back()
            }
          >
            Rời khỏi
          </button>
          <button
            className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm shadow-sm flex-1"
            onClick={handleSubmitClick}
          >
            Nộp bài
          </button>
        </div>
        <ToastContainer position="top-right" autoClose={2000} />
      </div>

      {/* Modal xác nhận nộp bài */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full border border-border shadow-xl text-foreground">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Xác nhận nộp bài
            </h3>

            <div className="mb-6">
              <p className="text-secondary mb-3 text-sm">
                {role === "student"
                  ? "Bạn có chắc chắn muốn nộp bài? Sau khi nộp bài, bạn sẽ không thể chỉnh sửa lại."
                  : "Xác nhận hoàn thành xem trước bài tập này?"}
              </p>

              {role === "student" && (
                <div className="bg-terra-amber/10 border border-terra-amber/20 rounded-xl p-3">
                  <div className="text-sm text-terra-amber">
                    <div className="font-medium mb-1">Thông tin bài làm:</div>
                    <div>
                      • Số câu đã trả lời: {Object.keys(getAnswers()).length}/
                      {questions.length}
                    </div>
                    <div>
                      • Thời gian làm bài: {Math.floor(getTimeSpent() / 60)}{" "}
                      phút {getTimeSpent() % 60} giây
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-foreground bg-muted rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                onClick={() => setShowConfirmModal(false)}
              >
                Hủy bỏ
              </button>
              <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium shadow-sm"
                onClick={handleConfirmSubmit}
              >
                {role === "student" ? "Nộp bài" : "Hoàn thành"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
