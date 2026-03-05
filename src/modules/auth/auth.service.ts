import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmployeesService } from '../employees/employee.service';
import { CompaniesService } from '../companies/companies.service';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { LoginDto } from './dto/auth.dto';
import { LoginCompanyDto } from '../companies/dto/create-company.dto';

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private jwtService: JwtService,
    private employeesService: EmployeesService,
    private companiesService: CompaniesService,
  ) {}

  async verifyGoogleIdToken(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID_MOBILE,
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new UnauthorizedException(
          'Не вдалося розшифрувати Google токен або відсутній email',
        );
      }

      return this.handleGoogleLogin(payload.email);
    } catch (error) {
      throw new UnauthorizedException(
        'Невалідний або прострочений Google токен',
      );
    }
  }

  async validateGoogleUser(profile: any) {
    const email = profile.emails[0].value;
    return this.handleGoogleLogin(email, true);
  }

  private async handleGoogleLogin(email: string, returnRaw = false) {
    const company = await this.companiesService.findByEmail(email);
    if (company) {
      return returnRaw
        ? { user: company, userType: 'company' }
        : this.login(company, 'company');
    }

    const employee = await this.employeesService.findByEmail(email);
    if (employee) {
      return returnRaw
        ? { user: employee, userType: 'employee' }
        : this.login(employee, 'employee');
    }

    throw new UnauthorizedException(
      'Акаунт з таким email не знайдено. Будь ласка, зареєструйтесь.',
    );
  }

  async registerCompany(dto: RegisterCompanyDto) {
    const existing = await this.companiesService.findByEmail(dto.email);
    if (existing)
      throw new ConflictException('Компанія з таким email вже існує.');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newCompany = await this.companiesService.create({
      ...dto,
      password: hashedPassword,
    });
    return ({accessToken: await this.login(newCompany, 'company'), ...newCompany});
  }

  async registerEmployee(dto: RegisterEmployeeDto) {
    let payload;
    try {
      payload = this.jwtService.verify(dto.inviteToken);
    } catch (e) {
      throw new ForbiddenException(
        'Недійсний або прострочений токен запрошення',
      );
    }

    if (payload.email !== dto.email) {
      throw new ForbiddenException(
        'Цей токен запрошення не належить вказаній пошті',
      );
    }

    const existing = await this.employeesService.findByEmail(dto.email);
    if (existing)
      throw new ConflictException(
        'Співробітник з таким email вже зареєстрований.',
      );

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newEmployee = await this.employeesService.create({
      ...dto,
      password: hashedPassword,
      companyId: payload.companyId,
    });

    return ({accessToken: await this.login(newEmployee, 'employee'), ...newEmployee});
  }

  async validateEmployee(dto: LoginDto) {
    const employee = await this.employeesService.findByEmail(dto.email);
    if (!employee || !employee.password) {
      throw new UnauthorizedException(
        'Невірний email або пароль (або вхід через Google)',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      employee.password,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Невірний email або пароль');

    return employee;
  }

  async validateCompany(dto: LoginCompanyDto) {
    const company = await this.companiesService.findByEmail(dto.email);
    if (!company || !company.password) {
      throw new UnauthorizedException('Невірні дані для входу');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      company.password,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Невірні дані для входу');

    return company;
  }

  async login(entity: any, userType: 'employee' | 'company') {
    const payload = {
      email: entity.email,
      sub: entity._id?.toString() || entity.id,
      userType,
    };
    return { accessToken: this.jwtService.sign(payload) };
  }

  async generateInviteToken(companyId: string, employeeEmail: string) {
    return this.jwtService.sign(
      { email: employeeEmail, companyId, purpose: 'invite' },
      { expiresIn: '7d' },
    );
  }

  async getProfile(userId: string, userType: string) {
    if (userType === 'company') {
      const company = await this.companiesService.findOne(userId);
      return {
        id: company.id,
        email: company.email,
        name: company.name,
        userType: 'company',
      };
    }

    const employee = await this.employeesService.findById(userId);
    return {
      id: employee._id.toString(),
      email: employee.email,
      name: employee.fullName,
      companyId: employee.companyId,
      userType: 'employee',
    };
  }
}
