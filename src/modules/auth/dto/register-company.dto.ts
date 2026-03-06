import { IsString, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterCompanyDto {
  @ApiProperty({ example: 'Tech Corp' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'IT' })
  @IsString()
  industry: string;

  @ApiProperty({ example: '51-200' })
  @IsString()
  size: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  contactName: string;

  @ApiProperty({ example: 'company@techcorp.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
