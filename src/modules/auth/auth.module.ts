import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmployeesModule } from '../employees/employee.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [
    EmployeesModule,
    PassportModule,
    forwardRef(() => CompaniesModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
