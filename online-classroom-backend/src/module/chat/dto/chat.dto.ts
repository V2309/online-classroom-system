import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class ReplyToUserDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsOptional()
  @IsString()
  img?: string | null;
}

export class ReplyToDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsObject()
  user!: ReplyToUserDto;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  classCode!: string;

  @IsOptional()
  @IsObject()
  replyTo?: ReplyToDto;
}

export class MessageActionDto {
  @IsString()
  @IsNotEmpty()
  classCode!: string;
}
