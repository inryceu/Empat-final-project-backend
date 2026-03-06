import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company, CompanySchema } from './schemas/company.schema';
import { AuthModule } from '../auth/auth.module';
import { Invite, InviteSchema } from './schemas/invite.schema';
import { EmployeesModule } from '../employees/employee.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Invite.name, schema: InviteSchema },
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => EmployeesModule),
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
