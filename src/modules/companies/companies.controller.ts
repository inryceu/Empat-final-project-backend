import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  Param,
  ValidationPipe,
  UsePipes,
  UseGuards,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CompaniesService } from './companies.service';
import { RegisterCompanyDto } from '../auth/dto/register-company.dto';
import { Company } from './company.interface';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AddDepartmentDto } from './dto/add-department.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

import {
  ApiFindAllCompanies,
  ApiFindOneCompany,
  ApiUpdateCompany,
  ApiDeleteCompany,
  ApiInviteEmployee,
  ApiAddDepartment,
  ApiGetDepartments,
} from './companies.swagger';

@ApiTags('Companies - Компанії')
@Controller({ path: 'companies', version: '1' })
@UsePipes(new ValidationPipe({ transform: true }))
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiFindAllCompanies()
  async findAll(): Promise<Company[]> {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @ApiFindOneCompany()
  async findOne(@Param('id') id: string): Promise<Company> {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateCompany()
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<RegisterCompanyDto>,
  ): Promise<Company> {
    return this.companiesService.update(id, updateData);
  }

  @Delete(':id')
  @ApiDeleteCompany()
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.companiesService.delete(id);
    return { message: 'Company deleted successfully' };
  }

  @Get('me/departments')
  @ApiGetDepartments()
  async getDepartments(@Req() req): Promise<string[]> {
    if (req.user.userType !== 'company') {
      throw new ForbiddenException(
        'Тільки компанії мають доступ до своїх відділів',
      );
    }
    const companyId = req.user._id?.toString() || req.user.id;
    return this.companiesService.getDepartments(companyId);
  }

  @Post('me/departments')
  @ApiAddDepartment()
  async addDepartment(
    @Req() req,
    @Body() dto: AddDepartmentDto,
  ): Promise<{ message: string; departments: string[] }> {
    if (req.user.userType !== 'company') {
      throw new ForbiddenException('Тільки компанії можуть створювати відділи');
    }
    const companyId = req.user._id?.toString() || req.user.id;
    const updatedDepartments = await this.companiesService.addDepartment(
      companyId,
      dto.name,
    );

    return {
      message: 'Відділ успішно додано',
      departments: updatedDepartments,
    };
  }

  @Post('invite-employee')
  @ApiInviteEmployee()
  async inviteEmployee(@Req() req, @Body() dto: CreateInviteDto) {
    if (req.user.userType !== 'company') {
      throw new ForbiddenException(
        'Тільки компанії можуть запрошувати співробітників',
      );
    }

    const companyId = req.user._id?.toString() || req.user.id;

    return this.companiesService.inviteEmployee(companyId, dto);
  }

  @Patch('employees/:employeeId')
  // @ApiUpdateEmployee() // Не забудь додати цей декоратор у companies.swagger.ts
  async updateEmployee(
    @Req() req,
    @Param('employeeId') employeeId: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    if (req.user.userType !== 'company') {
      throw new ForbiddenException(
        'Тільки компанії можуть оновлювати дані співробітників',
      );
    }

    const companyId = req.user._id?.toString() || req.user.id;

    return this.companiesService.updateEmployee(companyId, employeeId, dto);
  }
}
