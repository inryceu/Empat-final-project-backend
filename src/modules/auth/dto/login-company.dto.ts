import { IsString, IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginCompanyDto {
  @ApiProperty({
    example: 'pavel.maluev@gmail.com',
    description: 'Company contact email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Company password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
