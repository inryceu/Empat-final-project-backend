import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CompaniesService } from 'src/modules/companies/companies.service';
import { EmployeesService } from 'src/modules/employees/employee.service';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly usersService: EmployeesService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    if (payload.userType === 'company') {
      const company = await this.companiesService.findOne(payload.id);
      if (!company) throw new UnauthorizedException();
      return { ...company, userType: 'company' };
    }

    const user = await this.usersService.findById(payload.id);
    if (!user) throw new UnauthorizedException();
    return { ...user, userType: 'employee' };
  }
}
