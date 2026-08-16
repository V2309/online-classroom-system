import { IsArray, IsBoolean, IsOptional } from 'class-validator';

export class ShuffleQuizDto {
  @IsArray()
  quiz_data: any[];

  @IsOptional()
  @IsBoolean()
  shuffle_questions?: boolean;

  @IsOptional()
  @IsBoolean()
  shuffle_answers?: boolean;
}
