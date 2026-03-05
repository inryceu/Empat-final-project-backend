import { IsString, IsEmail, MinLength } from 'class-validator';

export class RegisterCompanyDto {
  @IsString()
  name: string;

  @IsString()
  industry: string;

  @IsString()
  size: string;

  @IsString()
  contactName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Пароль має містити мінімум 8 символів' })
  password: string;
}
