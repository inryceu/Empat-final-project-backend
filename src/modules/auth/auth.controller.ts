import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Res,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import type { Response } from 'express';

import { LoginDto, GoogleMobileLoginDto } from './dto/login-employee.dto';
import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { LoginCompanyDto } from './dto/login-company.dto';

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
    const email = req.user.emails[0].value;
    const frontendUrl = process.env.FRONTEND_URL;

    try {
      const { accessToken } = await this.authService.handleGoogleLogin(email);
      
      const redirectUrl = `${frontendUrl}/auth/success?token=${accessToken}`;
      return res.redirect(redirectUrl);
      
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        const errorUrl = `${frontendUrl}/auth/callback?error=account_not_found`;
        return res.redirect(302, errorUrl);
      }
      
      const serverErrorUrl = `${frontendUrl}/auth/callback?error=server_error`;
      return res.redirect(302, serverErrorUrl);
    }
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
  async getProfile(@Req() req, @Query('userType') userType?: string) {
    const type =
      userType === 'company' || userType === 'employee'
        ? userType
        : req.user?.userType || 'employee';
    return this.authService.getProfile(req.user.id, type);
  }
}
