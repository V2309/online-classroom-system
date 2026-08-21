import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum RecurrenceType {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY_BY_DATE = 'MONTHLY_BY_DATE',
  CUSTOM = 'CUSTOM',
}

export class CreateScheduleDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsInt()
  classId: number;

  @IsNotEmpty()
  @IsString()
  date: string; // YYYY-MM-DD

  @IsNotEmpty()
  @IsString()
  startTime: string; // HH:mm

  @IsNotEmpty()
  @IsString()
  endTime: string; // HH:mm

  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrenceType?: RecurrenceType;

  @IsOptional()
  interval?: number;

  @IsOptional()
  recurrenceEnd?: string;

  @IsOptional()
  @IsArray()
  weekDays?: number[];

  @IsOptional()
  maxOccurrences?: number;
}

export class CreateMeetingScheduleDto extends CreateScheduleDto {
  @IsOptional()
  @IsString()
  meetingId?: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;
}

export class UpdateScheduleDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
