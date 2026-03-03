import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import {
  ApiGoogleAuth,
  ApiGoogleAuthCallback,
  ApiGetCurrentUser,
} from './auth.swagger';

@ApiTags('Auth - Авторизація')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiGoogleAuth()
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiGoogleAuthCallback()
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const token = await this.authService.login(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiGetCurrentUser()
  getProfile(@Req() req) {
    return req.user;
  }
}

