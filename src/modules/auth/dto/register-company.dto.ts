import { IsString, IsEmail, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterCompanyDto {
  @ApiProperty({ example: 'Tech Corp', description: 'Name of the company' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Technology',
    description: 'Industry the company operates in',
  })
  @IsString()
  @IsNotEmpty()
  industry: string;

  @ApiProperty({
    example: '51-200',
    description: 'Size of the company (number of employees)',
  })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the company contact person',
  })
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiProperty({
    example: 'john@techcorp.com',
    description: 'Contact email for the company',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
