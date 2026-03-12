import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class WelcomeRequestDto {
  @ApiPropertyOptional({
    example: 'Олександр',
    description: "Ім'я співробітника для персоналізації привітання",
  })
  @IsOptional()
  @IsString()
  employeeName?: string;

  @ApiPropertyOptional({
    example: 'IT',
    description: 'Відділ, у якому працює співробітник',
  })
  @IsOptional()
  @IsString()
  department?: string;
}
