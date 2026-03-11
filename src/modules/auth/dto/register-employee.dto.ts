import { IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from './register-employee-enums';

export class RegisterEmployeeDto {
  @ApiProperty({
    example: '74f817d8b0c446aa738fbcedc601c292199888ea101c202da6558ec9e890e805',
    description: 'Унікальний хеш-токен із посилання запрошення',
  })
  @IsString()
  token: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: Gender, example: 'female' })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: 'Читання, Подорожі', required: false })
  @IsString()
  @IsOptional()
  hobbies?: string;

  @ApiProperty({ example: 'Кіт', required: false })
  @IsString()
  @IsOptional()
  favoriteAnimal?: string;
}
