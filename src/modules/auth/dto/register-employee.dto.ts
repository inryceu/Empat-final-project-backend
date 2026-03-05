import {
  IsString,
  IsEmail,
  MinLength,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

export class RegisterEmployeeDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  department: string;

  @IsEnum(['trainee', 'junior', 'middle', 'senior', 'lead'])
  role: 'trainee' | 'junior' | 'middle' | 'senior' | 'lead';

  @IsString()
  gender: string;

  @IsString()
  hobbies: string;

  @IsString()
  favoriteAnimal: string;

  @IsNotEmpty()
  inviteToken: string;
}
