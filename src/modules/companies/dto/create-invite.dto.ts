import { IsEmail, IsString, IsEnum } from 'class-validator';
import { EmployeeRole } from 'src/modules/employees/dto/enums';

export class CreateInviteDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString({ each: true })
  department: string;

  @IsEnum(EmployeeRole)
  role: EmployeeRole;
}
