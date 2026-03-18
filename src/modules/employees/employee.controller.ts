import {
  Controller,
  Get,
  Body,
  Patch,
  Req,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employee.service';
import { CompleteRegistrationDto } from '../auth/dto/complete-employee-registration.dto';
import { AuthGuard } from '@nestjs/passport';

import {
  ApiFindAllEmployees,
  ApiFindOneEmployee,
  ApiUpdateEmployee,
  ApiRemoveEmployee,
} from './employee.swagger';

@ApiTags('Employees - Співробітники')
@ApiBearerAuth()
@Controller({ path: 'employees', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  private getCompanyIdAndValidate(req: any): string {
    if (req.user.userType !== 'company') {
      throw new ForbiddenException(
        'Доступ заборонено. Тільки компанія має доступ до керування командою.',
      );
    }
    return req.user._id?.toString() || req.user.id;
  }

  @Get()
  @ApiFindAllEmployees()
  findAll(@Req() req) {
    const companyId = this.getCompanyIdAndValidate(req);
    return this.employeesService.findAll(companyId);
  }

  @Get(':id')
  @ApiFindOneEmployee()
  findOne(@Req() req, @Param('id') id: string) {
    const companyId = this.getCompanyIdAndValidate(req);
    return this.employeesService.findById(companyId, id);
  }

  @Patch(':id')
  @ApiUpdateEmployee()
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateEmployeeDto: Partial<CompleteRegistrationDto>,
  ) {
    const companyId = this.getCompanyIdAndValidate(req);
    return this.employeesService.update(companyId, id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiRemoveEmployee()
  remove(@Req() req, @Param('id') id: string) {
    const companyId = this.getCompanyIdAndValidate(req);
    return this.employeesService.delete(companyId, id);
  }
}
