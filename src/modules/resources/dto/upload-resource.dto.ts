import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadResourceDto {
  @ApiPropertyOptional({
    example: 'Інструкція для онбордингу',
    description:
      'Назва файлу бази знань (якщо не передати, автоматично використається оригінальна назва файлу)',
  })
  @IsString()
  @IsOptional()
  title?: string;
}

export class AddUrlResourceDto {
  @ApiProperty({
    example: 'Документація NestJS',
    description: 'Назва для збереженого посилання',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'https://docs.nestjs.com',
    description: 'Коректна URL-адреса ресурсу',
  })
  @IsUrl({}, { message: 'Передано невалідний формат URL' })
  @IsNotEmpty()
  url: string;
}
