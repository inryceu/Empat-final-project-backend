import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async validateGoogleUser(profile: any) {
    return this.usersService.findOrCreate(profile);
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException(
        'Користувач з таким email вже існує. Спробуйте увійти.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });

    return this.login(newUser);
  }

  async validateUserCredentials(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Невірний email або пароль');
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'Цей акаунт створено через Google. Будь ласка, використовуйте вхід через Google.',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Невірний email або пароль');
    }

    return user;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user._id?.toString() || user.id,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async verifyGoogleIdToken(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID_MOBILE,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException('Не вдалося розшифрувати Google токен');
      }

      const profile = {
        id: payload.sub,
        emails: [{ value: payload.email }],
        displayName: payload.name,
        photos: [{ value: payload.picture }],
      };

      const user = await this.usersService.findOrCreate(profile);

      return this.login(user);
    } catch (error) {
      console.error('Помилка верифікації Google токена:', error.message);
      throw new UnauthorizedException(
        'Невалідний або прострочений Google токен',
      );
    }
  }
}
