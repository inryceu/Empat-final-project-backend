import { IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { Gender } from '../../employees/dto/enums';

export class RegisterEmployeeDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8, { message: 'Пароль має містити мінімум 8 символів' })
  password: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  @IsOptional()
  hobbies?: string;

  @IsString()
  @IsOptional()
  favoriteAnimal?: string;
}
