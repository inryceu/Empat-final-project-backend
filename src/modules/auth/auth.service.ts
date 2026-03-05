import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CompaniesService } from '../companies/companies.service';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    @Inject(forwardRef(() => CompaniesService))
    private companiesService: CompaniesService,
  ) {}

  async validateGoogleUser(profile: any) {
    const email = profile.emails[0].value;

    const company = await this.companiesService.findByEmail(email);
    if (company) {
      return { ...(company.toObject?.() || company), userType: 'company' };
    }

    const user = await this.usersService.findOrCreate(profile);
    return { ...(user.toObject?.() || user), userType: 'employee' };
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

      const email = payload.email || '';

      const company = await this.companiesService.findByEmail(email);
      if (company) {
        return this.login(company, 'company');
      }

      const profile = {
        id: payload.sub,
        emails: [{ value: payload.email }],
        displayName: payload.name,
        photos: [{ value: payload.picture }],
      };

      const user = await this.usersService.findOrCreate(profile);

      return this.login(user, 'employee');
    } catch (error) {
      console.error('Помилка верифікації Google токена:', error.message);
      throw new UnauthorizedException(
        'Невалідний або прострочений Google токен',
      );
    }
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

  async login(user: any, userType: 'employee' | 'company' = 'employee') {
    const payload = {
      email: user.email,
      sub: user._id?.toString() || user.id,
      userType,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
