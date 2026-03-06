import { IsEmail, IsString, IsArray, IsEnum } from 'class-validator';
import { EmployeeRole } from 'src/modules/employees/dto/enums';

export class CreateInviteDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  departments: string[];

  @IsEnum(EmployeeRole)
  role: EmployeeRole;
}