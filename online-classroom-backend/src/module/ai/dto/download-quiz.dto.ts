import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class DownloadQuizDto {
  @IsArray()
  quiz_data: any[];

  @IsString()
  @IsIn(['pdf', 'docx'])
  format: 'pdf' | 'docx';

  @IsOptional()
  @IsString()
  filename?: string;
}
