import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({
    example: 'Які правила оформлення лікарняного?',
    description: 'Запитання користувача до бази знань',
  })
  query: string;

  @ApiProperty({
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
    description: 'ID компанії для пошуку контексту',
  })
  companyId: string;

  @ApiProperty({
    example: '65f1a2b3c4d5e6f7a8b9c0d2',
    description: 'ID співробітника, який робить запит',
  })
  employeeId: string; 
}