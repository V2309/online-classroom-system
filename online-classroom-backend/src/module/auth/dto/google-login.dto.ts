import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../../generated/prisma/enums';

export class GoogleLoginDto {
  @IsNotEmpty({ message: 'Google ID Token không được để trống' })
  @IsString()
  idToken: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ (student hoặc teacher)' })
  role?: UserRole;
}
