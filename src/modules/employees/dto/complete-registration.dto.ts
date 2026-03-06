import { IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { Gender } from './enums';

export class CompleteRegistrationDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
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
