import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddDepartmentDto {
  @ApiProperty({ example: 'Engineering', description: 'Назва відділу' })
  @IsString()
  @IsNotEmpty()
  name: string;
}