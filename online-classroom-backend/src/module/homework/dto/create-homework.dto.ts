import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum StudentViewPermissionEnum {
  NO_VIEW = 'NO_VIEW',
  SCORE_ONLY = 'SCORE_ONLY',
  SCORE_AND_RESULT = 'SCORE_AND_RESULT',
}

export enum GradingMethodEnum {
  FIRST_ATTEMPT = 'FIRST_ATTEMPT',
  LATEST_ATTEMPT = 'LATEST_ATTEMPT',
  HIGHEST_ATTEMPT = 'HIGHEST_ATTEMPT',
}

export class QuestionDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsNumber()
  questionNumber?: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  questionType?: string;

  @IsOptional()
  @IsArray()
  options?: any;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsNumber()
  point?: number;
}

export class CreateHomeworkDto {
  @IsString()
  title: string;

  @IsString()
  class_code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string; // 'original' | 'extracted' | 'essay'

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  fileType?: string;

  @IsOptional()
  @IsString()
  originalFileUrl?: string;

  @IsOptional()
  @IsString()
  originalFileName?: string;

  @IsOptional()
  @IsString()
  originalFileType?: string;

  @IsOptional()
  @IsNumber()
  points?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  deadline?: string;

  @IsOptional()
  @IsNumber()
  attempts?: number;

  @IsOptional()
  @IsNumber()
  maxAttempts?: number;

  @IsOptional()
  @IsEnum(StudentViewPermissionEnum)
  studentViewPermission?: StudentViewPermissionEnum;

  @IsOptional()
  @IsBoolean()
  blockViewAfterSubmit?: boolean;

  @IsOptional()
  @IsEnum(GradingMethodEnum)
  gradingMethod?: GradingMethodEnum;

  @IsOptional()
  @IsBoolean()
  isShuffleQuestions?: boolean;

  @IsOptional()
  @IsBoolean()
  isShuffleAnswers?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions?: QuestionDto[];

  // Hỗ trợ extracted questions
  @IsOptional()
  @IsArray()
  extractedQuestions?: Array<{
    question_number: number;
    question_text: string;
    options: string[];
    correct_answer_char: string;
    correct_answer_index?: number;
    point?: number;
  }>;

  // Hỗ trợ essay questions
  @IsOptional()
  @IsArray()
  essayQuestions?: Array<{
    question_number: number;
    question_text: string;
    suggested_answer?: string;
    point?: number;
  }>;

  @IsOptional()
  @IsString()
  source_type?: 'file' | 'topic';

  @IsOptional()
  @IsString()
  source_name?: string;
}
