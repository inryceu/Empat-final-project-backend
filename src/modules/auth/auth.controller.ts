import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import type { Response } from 'express';

@ApiTags('Auth - Авторизація')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Редирект на сторінку логіну Google' })
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Колбек від Google (Фронтенд сюди не стукає напряму)' })
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const token = await this.authService.login(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Отримати профіль поточного юзера по токену' })
  getProfile(@Req() req) {
    return req.user;
  }
}