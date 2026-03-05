import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employee.service';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { AuthGuard } from '@nestjs/passport';

import {
  ApiFindAllEmployees,
  ApiFindOneEmployee,
  ApiUpdateEmployee,
  ApiRemoveEmployee,
} from './employee.swagger';

@ApiTags('Employees - Співробітники')
@ApiBearerAuth()
@Controller({ path: 'employees', version: '1' }) // Змінено path з 'users' на 'employees'
@UseGuards(AuthGuard('jwt'))
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiFindAllEmployees()
  findAll() {
    return this.employeesService.findAll();
  }

  @Get(':id')
  @ApiFindOneEmployee()
  findOne(@Param('id') id: string) {
    return this.employeesService.findById(id);
  }

  @Patch(':id')
  @ApiUpdateEmployee()
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiRemoveEmployee()
  remove(@Param('id') id: string) {
    return this.employeesService.delete(id); // Зверніть увагу: у вашому сервісі метод називався remove(), а не delete()
  }
}