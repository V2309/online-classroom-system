// types/homework.ts

export interface QuizQuestion {
  question_number: number;
  question_text: string;
  options: string[];
  correct_answer_char: string;
  correct_answer_index: number;
  point?: number;
}

export interface QuizData {
  success: boolean;
  filename: string;
  quiz_data: QuizQuestion[];
  total_questions: number;
  originalFile?: {
    file?: File;
    url?: string; // AWS S3 URL
    name: string;
    type: string;
    size: number;
  };
}

export interface HomeworkFormData {
  title: string;
  duration: number;
  startTime: string;
  endTime: string;
  maxAttempts: number;
  points: number;
  studentViewPermission: 'NO_VIEW' | 'SCORE_ONLY' | 'SCORE_AND_RESULT';
  blockViewAfterSubmit: boolean;
  gradingMethod: 'FIRST_ATTEMPT' | 'LATEST_ATTEMPT' | 'HIGHEST_ATTEMPT';
  isShuffleQuestions?: boolean;
  isShuffleAnswers?: boolean;
}

export interface QuestionWithAnswer {
  questionNumber: number;
  answer: string;
  point: number;
}

export interface ExtractedQuestion extends QuizQuestion {
  point: number;
}