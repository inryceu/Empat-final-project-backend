import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ChatRequestDto {
  @ApiProperty({
    example: 'Які правила оформлення лікарняного?',
    description: 'Запитання користувача до бази знань',
  })
  @IsString()
  @IsNotEmpty()
  query: string;
}
