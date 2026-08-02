import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../../../generated/prisma/enums';

export class SignupDto {
  @IsString()
  username!: string;

  @IsString()
  class_name!: string;

  @IsString()
  schoolname!: string;

  @IsDateString()
  birthday!: string;

  @IsString()
  address!: string;

  @ValidateIf((dto: SignupDto) => !dto.phone)
  @IsEmail()
  email?: string;

  @ValidateIf((dto: SignupDto) => !dto.email)
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  img?: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @MinLength(8)
  password!: string;
}
