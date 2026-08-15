import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  classCode!: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxSize?: number;
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxSize?: number;
}

export class UpdateGroupMemberDto {
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @IsOptional()
  @IsString()
  targetGroupId?: string | null;

  @IsString()
  @IsNotEmpty()
  classCode!: string;
}

export class SetGroupLeaderDto {
  @IsString()
  @IsNotEmpty()
  studentId!: string;
}
