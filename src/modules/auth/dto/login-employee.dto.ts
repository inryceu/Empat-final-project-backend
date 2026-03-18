import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'maluiev.p.a.-im41@edu.kpi.ua' })
  @IsEmail({}, { message: 'Неправильний формат email' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8, { message: 'Пароль має містити мінімум 8 символів' })
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
