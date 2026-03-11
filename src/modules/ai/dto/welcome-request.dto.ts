import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WelcomeRequestDto {
  @ApiProperty({
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
    description: 'ID компанії',
  })
  companyId: string;

  @ApiProperty({
    example: '65f1a2b3c4d5e6f7a8b9c0d2',
    description: 'ID співробітника',
  })
  employeeId: string;

  @ApiPropertyOptional({
    example: 'Олександр',
    description: "Ім'я співробітника для персоналізації привітання",
  })
  employeeName?: string;

  @ApiPropertyOptional({
    example: 'IT',
    description: 'Відділ, у якому працює співробітник',
  })
  department?: string;

  @ApiPropertyOptional({
    example: ['remote', 'developer'],
    description: 'Додаткові теги співробітника',
  })
  tags?: any;
}