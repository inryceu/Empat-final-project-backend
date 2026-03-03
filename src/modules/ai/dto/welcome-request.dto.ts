import { ApiProperty } from '@nestjs/swagger';

export class WelcomeRequestDto {
  @ApiProperty({
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
    description: 'ID компанії',
  })
  companyId: string;

  @ApiProperty({
    example: 'Олександр',
    description: 'Ім’я нового співробітника',
  })
  employeeName: string;

  @ApiProperty({
    example: 'Frontend Developer',
    description: 'Посада новачка',
  })
  position: string;
}
