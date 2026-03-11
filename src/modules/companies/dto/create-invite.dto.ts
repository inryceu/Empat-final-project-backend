import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsEnum } from 'class-validator';
import { EmployeeRole } from 'src/modules/auth/dto/register-employee-enums';

export class CreateInviteDto {
  @ApiProperty({
    example: 'new.employee@empat.tech',
    description: 'Email майбутнього співробітника',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Jane Smith',
    description: "Ім'я та прізвище",
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Engineering',
    description: 'Відділ, до якого належатиме співробітник',
  })
  @IsString()
  department: string;

  @ApiProperty({
    enum: EmployeeRole,
    example: EmployeeRole.MIDDLE,
    description: 'Рівень/Посада співробітника',
  })
  @IsEnum(EmployeeRole)
  role: EmployeeRole;
}
