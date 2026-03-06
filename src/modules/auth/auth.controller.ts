import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import type { Response } from 'express';

import { LoginDto, GoogleMobileLoginDto } from './dto/auth.dto';
import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { LoginCompanyDto } from '../companies/dto/create-company.dto';

import {
  ApiGoogleAuth,
  ApiGoogleAuthCallback,
  ApiGoogleAuthMobile,
  ApiRegisterEmployee,
  ApiLoginEmployee,
  ApiRegisterCompany,
  ApiLoginCompany,
  ApiGetProfile,
} from './auth.swagger';

@ApiTags('Auth - Авторизація')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiGoogleAuth()
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiGoogleAuthCallback()
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const userType = req.user.userType || 'employee';
    const { accessToken } = await this.authService.login(req.user, userType);
    const profile = await this.authService.getProfile(
      req.user.id,
      req.user.userType,
    );
    return { accessToken, ...profile };
  }

  @Post('google/mobile')
  @ApiGoogleAuthMobile()
  async googleAuthMobile(@Body() dto: GoogleMobileLoginDto) {
    return this.authService.verifyGoogleIdToken(dto.idToken);
  }

  @Post('employee/register')
  @ApiRegisterEmployee()
  async registerEmployee(@Body() dto: RegisterEmployeeDto) {
    return await this.authService.registerEmployee(dto);
  }

  @Post('employee/login')
  @ApiLoginEmployee()
  async loginEmployee(@Body() dto: LoginDto) {
    const user = await this.authService.validateEmployee(dto);
    return this.authService.login(user, 'employee');
  }

  @Post('company/register')
  @ApiRegisterCompany()
  async registerCompany(@Body() dto: RegisterCompanyDto) {
    return await this.authService.registerCompany(dto);
  }

  @Post('company/login')
  @ApiLoginCompany()
  async loginCompany(@Body() dto: LoginCompanyDto) {
    const company = await this.authService.validateCompany(dto);
    return this.authService.login(company, 'company');
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiGetProfile()
  async getProfile(@Req() req) {
    return this.authService.getProfile(req.user.id, req.user.userType);
  }
}
