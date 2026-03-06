import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateEmployeeDto {
  @ApiProperty({
    example: 'Jane Doe',
    required: false,
    description: "Нове ім'я співробітника",
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'https://example.com/avatars/jane-doe.jpg',
    required: false,
    description: 'Посилання на нове фото профілю',
  })
  @IsString()
  @IsOptional()
  picture?: string;

  @ApiProperty({
    example: 'Читання, Велоспорт',
    required: false,
    description: 'Нові хобі співробітника',
  })
  @IsString()
  @IsOptional()
  hobbies?: string;

  @ApiProperty({
    example: 'Собака',
    required: false,
    description: 'Нова улюблена тварина',
  })
  @IsString()
  @IsOptional()
  favoriteAnimal?: string;
}
