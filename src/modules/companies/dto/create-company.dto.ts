import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Tech Corp', description: 'Name of the company' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Technology', description: 'Industry the company operates in' })
  @IsString()
  @IsNotEmpty()
  industry: string;

  @ApiProperty({ example: '50-100', description: 'Size of the company (number of employees)' })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the company contact person' })
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiProperty({ example: 'john@techcorp.com', description: 'Contact email for the company' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Password for company account', required: false })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}

export class LoginCompanyDto {
  @ApiProperty({ example: 'admin@company.com', description: 'Company contact email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Company password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}