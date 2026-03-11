import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'pavel.maluev@gmail.com' })
  @IsEmail({}, { message: 'Невірний формат email' })
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(8, { message: 'Пароль має містити мінімум 6 символів' })
  password: string;
}

export class GoogleMobileLoginDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1...',
    description: 'ID токен, отриманий від Google на мобільному пристрої',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
