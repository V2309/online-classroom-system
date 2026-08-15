import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class SaveDraftDto {
  @IsOptional()
  answers?: any;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsBoolean()
  isPartial?: boolean;
}

export class SubmitHomeworkDto {
  @IsOptional()
  answers?: any;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsNumber()
  timeSpent?: number;

  @IsOptional()
  @IsNumber()
  violationCount?: number;

  @IsOptional()
  file?: {
    name: string;
    type: string;
    url: string;
    size?: number;
  };
}

export class GradeSubmissionDto {
  @IsNumber()
  submissionId: number;

  @IsNumber()
  grade: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsObject()
  questionGrades?: Record<string, any>;
}
