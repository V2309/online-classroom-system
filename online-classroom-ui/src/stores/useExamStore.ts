import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ExamState {
  activeExamId: string | number | null;
  // answers: questionId -> answer (string, number, array, etc.)
  answers: Record<string, any>;
  timeRemaining: number | null;
  isSubmitted: boolean;
  lastSavedAt: string | null;

  // Actions
  startExam: (examId: string | number, initialDurationSeconds?: number) => void;
  setAnswer: (questionId: string | number, answer: any) => void;
  setAnswers: (answers: Record<string, any>) => void;
  setTimeRemaining: (seconds: number) => void;
  decrementTime: () => void;
  markSubmitted: () => void;
  clearExam: (examId?: string | number) => void;
}

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      activeExamId: null,
      answers: {},
      timeRemaining: null,
      isSubmitted: false,
      lastSavedAt: null,

      startExam: (examId, initialDurationSeconds) => {
        const state = get();
        // Nếu bài thi khác với bài đang lưu thì reset
        if (state.activeExamId !== examId) {
          set({
            activeExamId: examId,
            answers: {},
            timeRemaining: initialDurationSeconds ?? null,
            isSubmitted: false,
            lastSavedAt: new Date().toISOString(),
          });
        } else if (state.timeRemaining === null && initialDurationSeconds) {
          set({ timeRemaining: initialDurationSeconds });
        }
      },

      setAnswer: (questionId, answer) =>
        set((state) => ({
          answers: {
            ...state.answers,
            [String(questionId)]: answer,
          },
          lastSavedAt: new Date().toISOString(),
        })),

      setAnswers: (answers) =>
        set({
          answers,
          lastSavedAt: new Date().toISOString(),
        }),

      setTimeRemaining: (timeRemaining) => set({ timeRemaining }),

      decrementTime: () =>
        set((state) => {
          if (state.timeRemaining === null || state.timeRemaining <= 0) {
            return { timeRemaining: 0 };
          }
          return { timeRemaining: state.timeRemaining - 1 };
        }),

      markSubmitted: () => set({ isSubmitted: true }),

      clearExam: (examId) =>
        set((state) => {
          if (!examId || state.activeExamId === examId) {
            return {
              activeExamId: null,
              answers: {},
              timeRemaining: null,
              isSubmitted: false,
              lastSavedAt: null,
            };
          }
          return state;
        }),
    }),
    {
      name: 'classroom-exam-draft-store',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
    }
  )
);
