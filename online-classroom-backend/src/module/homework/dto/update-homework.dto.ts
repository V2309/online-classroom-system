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
import {
  GradingMethodEnum,
  QuestionDto,
  StudentViewPermissionEnum,
} from './create-homework.dto';

export class UpdateHomeworkQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}

export class UpdateHomeworkSettingsDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

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
}
