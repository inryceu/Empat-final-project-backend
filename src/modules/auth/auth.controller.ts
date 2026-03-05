import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Res,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CompaniesService } from '../companies/companies.service';
import type { Response } from 'express';
import { RegisterDto, LoginDto, GoogleMobileLoginDto } from './dto/auth.dto';

import {
  ApiGoogleAuth,
  ApiGoogleAuthCallback,
  ApiGetCurrentUser,
  ApiRegisterUser,
  ApiLoginUser,
  ApiGoogleAuthMobile,
} from './auth.swagger';

@ApiTags('Auth - Авторизація')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => CompaniesService))
    private readonly companiesService: CompaniesService,
  ) {}

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

    res.redirect(
      `${process.env.FRONTEND_URL}/auth/success?token=${accessToken}`,
    );
  }

  @Post('register')
  @ApiRegisterUser()
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiLoginUser()
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUserCredentials(loginDto);
    return this.authService.login(user);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiGetCurrentUser()
  async getProfile(@Req() req) {
    const userId = req.user.userId || req.user.sub || req.user.id;
    const userType = req.user.userType;

    if (userType === 'company') {
      const company = await this.companiesService.findOne(userId);
      return {
        id: company.id,
        email: company.email,
        name: company.name,
        userType: 'company',
      };
    }

    const user = await this.usersService.findById(userId);
    return {
      id: user._id,
      googleId: user.googleId,
      email: user.email,
      fullName: user.fullName,
      picture: user.picture,
      userType: 'employee',
    };
  }

  @Post('google/mobile')
  @ApiGoogleAuthMobile()
  async googleAuthMobile(@Body() dto: GoogleMobileLoginDto) {
    return this.authService.verifyGoogleIdToken(dto.idToken);
  }
}
