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
import { RegisterEmployeeDto } from './dto/register-employee-in-company.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { LoginDto } from './dto/auth-employee.dto';
import { LoginCompanyDto } from './dto/login-company.dto';

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private jwtService: JwtService,
    private employeesService: EmployeesService,
    private companiesService: CompaniesService,
  ) {}

  async login(entity: any, userType: 'employee' | 'company') {
    const payload = {
      email: entity.email,
      id: entity._id?.toString() || entity.id,
      userType,
    };
    const accessToken = this.jwtService.sign(payload);

    const entityData = entity.toObject ? entity.toObject() : { ...entity };
    delete entityData.password;
    delete entityData.__v;

    const res = {
      accessToken,
      user: {
        ...entityData,
        id: entity._id?.toString() || entity.id,
        userType,
      },
    };
    delete res.user._id;
    return res;
  }

  async registerCompany(dto: RegisterCompanyDto) {
    const existing = await this.companiesService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Компанія з таким email вже існує.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newCompany = await this.companiesService.create({
      ...dto,
      password: hashedPassword,
    });

    return this.login(newCompany, 'company');
  }

  async registerEmployee(dto: RegisterEmployeeDto) {
    const invite = await this.companiesService.findInviteByToken(dto.token);

    if (!invite) {
      throw new ForbiddenException(
        'Недійсний токен або запрошення вже було використано',
      );
    }

    const existing = await this.employeesService.findByEmail(invite.email);
    if (existing) {
      throw new ConflictException(
        'Співробітник з таким email вже зареєстрований.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newEmployee = await this.employeesService.create({
      email: invite.email,
      name: invite.name,
      companyId: invite.companyId,
      department: invite.department,
      role: invite.role,

      password: hashedPassword,
      gender: dto.gender,
      hobbies: dto.hobbies,
      favoriteAnimal: dto.favoriteAnimal,
    });

    await this.companiesService.deleteInvite(invite._id.toString());

    return this.login(newEmployee, 'employee');
  }

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

  async generateInviteToken(companyId: string, employeeEmail: string) {
    return this.jwtService.sign(
      { email: employeeEmail, companyId, purpose: 'invite' },
      { expiresIn: '7d' },
    );
  }

  async getProfile(userId: string, userType: string) {
    if (userType === 'company') {
      const company = await this.companiesService.findOne(userId);
      const companyData = company.toObject
        ? company.toObject()
        : { ...company };
      delete companyData.password;
      return {
        ...companyData,
        id: company._id?.toString() || company.id,
        userType: 'company',
      };
    }

    const employee = await this.employeesService.findById(userId);
    const employeeData = employee.toObject
      ? employee.toObject()
      : { ...employee };
    delete employeeData.password;
    return {
      ...employeeData,
      id: employee._id?.toString() || employee.id,
      userType: 'employee',
    };
  }
}
