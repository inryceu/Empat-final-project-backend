import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { Gender } from './register-employee-enums';

export class CompleteRegistrationDto {
  @ApiProperty({
    example: '74f817d8b0c446aa738fbcedc601c292199888ea101c202da6558ec9e890e805',
    description: 'Унікальний hex-токен, отриманий з посилання запрошення',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'Password123!',
    minLength: 8,
    description: 'Пароль (мінімум 8 символів)',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    enum: Gender,
    example: 'female',
    description: 'Стать співробітника',
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    example: 'Читання, Подорожі',
    required: false,
    description: "Хобі (необов'язково)",
  })
  @IsString()
  @IsOptional()
  hobbies?: string;

  @ApiProperty({
    example: 'Кіт',
    required: false,
    description: "Улюблена тварина (необов'язково)",
  })
  @IsString()
  @IsOptional()
  favoriteAnimal?: string;
}
