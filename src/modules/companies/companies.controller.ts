import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ValidationPipe,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, LoginCompanyDto } from './dto/create-company.dto';
import { Company } from './company.interface';

import {
  ApiCreateCompany,
  ApiLoginCompany,
  ApiFindAllCompanies,
  ApiFindOneCompany,
  ApiUpdateCompany,
  ApiDeleteCompany,
} from './companies.swagger';

@ApiTags('Companies - Компанії')
@Controller({ path: 'companies', version: '1' })
@UsePipes(new ValidationPipe({ transform: true }))
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiCreateCompany()
  async create(@Body() createCompanyDto: CreateCompanyDto): Promise<Company> {
    return this.companiesService.create(createCompanyDto);
  }

  @Post('login')
  @ApiLoginCompany()
  async login(
    @Body() loginDto: LoginCompanyDto,
  ): Promise<Omit<Company, 'password'>> {
    return this.companiesService.login(loginDto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiFindAllCompanies()
  async findAll(): Promise<Company[]> {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiFindOneCompany()
  async findOne(@Param('id') id: string): Promise<Company> {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiUpdateCompany()
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateCompanyDto>,
  ): Promise<Company> {
    return this.companiesService.update(id, updateData);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiDeleteCompany()
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.companiesService.delete(id);
    return { message: 'Company deleted successfully' };
  }
}
