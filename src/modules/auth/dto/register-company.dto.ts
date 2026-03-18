import {
  IsString,
  IsEmail,
  MinLength,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CompanySize, Industry } from './register-company-enums';

export class RegisterCompanyDto {
  @ApiProperty({ example: 'Tech Corp', description: 'Name of the company' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: Industry,
    example: Industry.TECHNOLOGY,
    description: 'Галузь, в якій працює компанія',
  })
  @IsEnum(Industry, {
    message: 'Недійсне значення галузі. Оберіть із: technology, finance, other',
  })
  @IsNotEmpty({ message: 'Галузь є обов’язковою' })
  industry: Industry;

  @ApiProperty({
    enum: CompanySize,
    example: CompanySize.MEDIUM,
    description: 'Розмір компанії',
  })
  @IsEnum(CompanySize, {
    message: 'Недійсний розмір компанії. Оберіть із: 1-20, 21-50, 51-200',
  })
  @IsNotEmpty({ message: 'Розмір компанії є обов’язковим' })
  size: CompanySize;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the company contact person',
  })
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiProperty({
    example: 'pavel.maluev@gmail.com',
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
