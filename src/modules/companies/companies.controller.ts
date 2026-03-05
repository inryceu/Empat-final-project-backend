import {
  Controller,
  Get,
  Patch,
  Delete,
  Post, // Додав Post
  Body,
  Param,
  ValidationPipe,
  UsePipes,
  UseGuards,
  ForbiddenException,
  Req,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CompaniesService } from './companies.service';
import { AuthService } from '../auth/auth.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { Company } from './company.interface';

import {
  ApiFindAllCompanies,
  ApiFindOneCompany,
  ApiUpdateCompany,
  ApiDeleteCompany,
  ApiInviteEmployee,
} from './companies.swagger';

@ApiTags('Companies - Компанії')
@Controller({ path: 'companies', version: '1' })
@UsePipes(new ValidationPipe({ transform: true }))
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

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
    @Body() updateData: Partial<CreateCompanyDto>,
  ): Promise<Company> {
    return this.companiesService.update(id, updateData);
  }

  @Delete(':id')
  @ApiDeleteCompany()
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.companiesService.delete(id);
    return { message: 'Company deleted successfully' };
  }

  @Post('invite-employee')
  @ApiInviteEmployee()
  async inviteEmployee(@Req() req, @Body('email') employeeEmail: string) {
    if (req.user.userType !== 'company') {
      throw new ForbiddenException(
        'Тільки компанії можуть запрошувати співробітників',
      );
    }

    const companyId = req.user._id?.toString() || req.user.id;

    const inviteToken = await this.authService.generateInviteToken(
      companyId,
      employeeEmail,
    );

    // TODO: Відправити inviteToken на employeeEmail через сервіс розсилки (наприклад, SendGrid/Nodemailer)
    return {
      message: 'Запрошення створено',
      inviteLink: `${process.env.FRONTEND_URL}/register-employee?token=${inviteToken}&email=${employeeEmail}`,
    };
  }
}
