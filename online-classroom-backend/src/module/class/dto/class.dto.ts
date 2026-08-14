import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity?: number;

  // gradeId bắt buộc theo schema (Class.gradeId Int)
  @IsInt()
  @Type(() => Number)
  gradeId!: number;

  @IsOptional()
  @IsString()
  img?: string;
}

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  gradeId?: number;

  @IsOptional()
  @IsString()
  newGradeLevel?: string;

  @IsOptional()
  @IsString()
  img?: string;

  @IsOptional()
  @IsBoolean()
  isProtected?: boolean;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  blockLeave?: boolean;

  @IsOptional()
  @IsBoolean()
  allowGradesView?: boolean;

  @IsOptional()
  @IsString()
  supervisorId?: string;
}

export class ClassQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
