// types/homework.ts

export type StudentViewPermission = 'NO_VIEW' | 'SCORE_ONLY' | 'SCORE_AND_RESULT';
export type GradingMethod = 'FIRST_ATTEMPT' | 'LATEST_ATTEMPT' | 'HIGHEST_ATTEMPT';
export type HomeworkType = 'original' | 'extracted' | 'essay';

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
    url?: string;
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
  studentViewPermission: StudentViewPermission;
  blockViewAfterSubmit: boolean;
  gradingMethod: GradingMethod;
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

export interface QuestionData {
  id?: number;
  questionNumber: number;
  content?: string;
  questionType?: string;
  options?: any;
  answer: string;
  point?: number;
}

export interface CreateHomeworkRequest {
  title: string;
  class_code: string;
  description?: string;
  type?: HomeworkType;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  originalFileUrl?: string;
  originalFileName?: string;
  originalFileType?: string;
  points?: number;
  duration?: number;
  startTime?: string;
  endTime?: string;
  deadline?: string;
  attempts?: number;
  maxAttempts?: number;
  studentViewPermission?: StudentViewPermission;
  blockViewAfterSubmit?: boolean;
  gradingMethod?: GradingMethod;
  isShuffleQuestions?: boolean;
  isShuffleAnswers?: boolean;
  questions?: QuestionData[];
  extractedQuestions?: Array<{
    question_number: number;
    question_text: string;
    options: string[];
    correct_answer_char: string;
    correct_answer_index?: number;
    point?: number;
  }>;
  essayQuestions?: Array<{
    question_number: number;
    question_text: string;
    suggested_answer?: string;
    point?: number;
  }>;
  source_type?: 'file' | 'topic';
  source_name?: string;
}

export interface UpdateHomeworkSettingsRequest {
  title?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  maxAttempts?: number;
  studentViewPermission?: StudentViewPermission;
  blockViewAfterSubmit?: boolean;
  gradingMethod?: GradingMethod;
  isShuffleQuestions?: boolean;
  isShuffleAnswers?: boolean;
}

export interface SubmitHomeworkRequest {
  answers: any;
  studentId?: string;
  userId?: string;
  role?: string;
  timeSpent?: number;
  violationCount?: number;
  file?: {
    name?: string;
    type?: string;
    url?: string;
    size?: number;
  };
}

export interface SaveDraftRequest {
  answers: any;
  userId?: string;
  isPartial?: boolean;
}

export interface GradeSubmissionRequest {
  submissionId: number;
  grade: number;
  feedback?: string;
  questionGrades?: Record<string, any>;
}

export interface SubmissionDetailQuery {
  utid?: number | string;
  homeworkId?: number | string;
  studentId?: string;
  getBest?: boolean;
}

export interface SubmissionCountResponse {
  count: number;
  bestSubmissionId?: number | null;
  bestGrade?: number | null;
}

export interface DownloadInfoResponse {
  fileUrl: string;
  fileName?: string;
  fileType?: string;
}