import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";

interface HomeworkSession {
  answers: Record<number, string>;
  timeLeft: number;
  startTime: number | null;
  isInitialized: boolean;
}

interface UseHomeworkSessionProps {
  homeworkId: number;
  duration: number; // phút
  onTimeUp?: () => void;
  role?: string; // Vai trò của người dùng (teacher/student)
}

export function useHomeworkSession({ homeworkId, duration, onTimeUp, role }: UseHomeworkSessionProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(duration * 60); // giây
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const storageKey = `homework-${homeworkId}${role === 'teacher' ? '-teacher' : ''}`;
  const isTeacher = role === 'teacher';

  // Hàm khởi tạo phiên làm bài mới
  const initializeNewSession = useCallback(() => {
    const now = Date.now();
    setStartTime(now);
    setTimeLeft(duration * 60);
    setAnswers({});
    console.log(`Bắt đầu phiên làm bài mới${isTeacher ? ' (Giáo viên)' : ''}`);
  }, [duration, isTeacher]);

  // Khởi tạo trạng thái từ localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(storageKey);
    console.log("Saved state:", savedState);
    
    if (savedState) {
      try {
        const { savedAnswers, savedStartTime, savedTimeLeft } = JSON.parse(savedState);
        
        if (savedStartTime && savedTimeLeft) {
          // Nếu là teacher, không tính toán thời gian còn lại theo thời gian thực
          if (isTeacher) {
            setStartTime(savedStartTime);
            setTimeLeft(savedTimeLeft);
            setAnswers(savedAnswers || {});
            console.log(`Khôi phục trạng thái giáo viên: ${Object.keys(savedAnswers || {}).length} câu đã trả lời`);
          } else {
            // Tính toán thời gian còn lại dựa trên thời gian thực cho học sinh
            const now = Date.now();
            const elapsedTime = Math.floor((now - savedStartTime) / 1000);
            const remainingTime = Math.max(0, savedTimeLeft - elapsedTime);
            
            setStartTime(savedStartTime);
            setTimeLeft(remainingTime);
            setAnswers(savedAnswers || {});
            
            console.log(`Khôi phục trạng thái: Thời gian còn lại ${remainingTime}s, Đã trả lời ${Object.keys(savedAnswers || {}).length} câu`);
            
            // Thông báo cho user biết đã khôi phục trạng thái
            if (Object.keys(savedAnswers || {}).length > 0) {
              toast.info(`Đã khôi phục tiến độ làm bài! Còn ${Math.floor(remainingTime / 60)}:${(remainingTime % 60).toString().padStart(2, '0')} phút`);
            }
          }
        } else {
          initializeNewSession();
        }
      } catch (error) {
        console.error("Lỗi khi parse localStorage:", error);
        initializeNewSession();
      }
    } else {
      initializeNewSession();
    }
    
    setIsInitialized(true);
  }, [homeworkId, duration, storageKey, isTeacher, initializeNewSession]);

  // Lưu trạng thái vào localStorage
  useEffect(() => {
    if (isInitialized && startTime) {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          savedAnswers: answers,
          savedStartTime: startTime,
          savedTimeLeft: timeLeft,
        })
      );
    }
  }, [answers, timeLeft, startTime, isInitialized, storageKey]);

  // Đếm ngược thời gian
  useEffect(() => {
    // Nếu là teacher, không đếm ngược thời gian
    if (isTeacher) return;
    
    if (isInitialized && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          const newTime = t - 1;
          if (newTime <= 0) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return newTime;
        });
      }, 1000);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [isInitialized, timeLeft, isTeacher]);

  // Thông báo sắp hết giờ và tự động nộp bài
  useEffect(() => {
    // Không áp dụng cho teacher
    if (isTeacher) return;
    
    if (timeLeft === 60) {
      toast.warn("Còn 1 phút, hãy nộp bài!");
    }
    if (timeLeft === 0 && isInitialized && onTimeUp) {
      toast.info("Hết giờ, bài sẽ tự động nộp!");
      onTimeUp();
    }
  }, [timeLeft, isInitialized, onTimeUp, isTeacher]);

  // Xử lý khi user rời khỏi trang
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(answers).length > 0) {
        e.preventDefault();
        const message = isTeacher 
          ? "Bạn có chắc muốn rời khỏi? Tiến độ làm thử sẽ được lưu."
          : "Bạn có chắc muốn rời khỏi? Tiến độ làm bài sẽ được lưu.";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answers, isTeacher]);

  // Các hàm tiện ích
  const updateAnswer = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const getTimeSpent = () => {
    return startTime ? Math.floor((Date.now() - startTime) / 1000) : duration * 60 - timeLeft;
  };

  const clearSession = () => {
    localStorage.removeItem(storageKey);
    setAnswers({});
    setTimeLeft(duration * 60);
    setStartTime(null);
    setIsInitialized(false);
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const getUnansweredQuestions = (questionIds: number[]) => {
    return questionIds.filter(id => !answers[id]);
  };

  return {
    // State
    answers,
    timeLeft,
    startTime,
    isInitialized,
    
    // Actions
    updateAnswer,
    getTimeSpent,
    clearSession,
    getAnsweredCount,
    getUnansweredQuestions,
    
    // Computed values
    minutes: Math.floor(timeLeft / 60),
    seconds: timeLeft % 60,
  };
} 