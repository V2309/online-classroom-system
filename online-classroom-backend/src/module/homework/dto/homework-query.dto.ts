import { IsOptional, IsString } from 'class-validator';

export class SubmissionsCountQueryDto {
  @IsString()
  homeworkId: string;
}

export class SubmissionDetailQueryDto {
  @IsOptional()
  @IsString()
  utid?: string;

  @IsOptional()
  @IsString()
  homeworkId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  getBest?: string;
}
