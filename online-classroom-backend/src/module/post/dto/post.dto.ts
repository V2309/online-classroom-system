import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @IsOptional()
  @IsString()
  desc?: string;

  @IsOptional()
  @IsString()
  img?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  imgHeight?: number;

  @IsOptional()
  @IsString()
  video?: string;

  @IsOptional()
  @IsString()
  classCode?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  parentPostId?: number;
}

export class CreateCommentDto {
  @IsString()
  desc!: string;
}

export class PostQueryDto {
  @IsOptional()
  @IsString()
  classCode?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
