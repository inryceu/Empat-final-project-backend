import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeesService } from './employee.service';
import { EmployeesController } from './employee.controller';
import { Employee, EmployeeSchema } from './schemas/employee.schema';
import { Invite, InviteSchema } from '../companies/schemas/invite.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Invite.name, schema: InviteSchema },
    ]),
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService, MongooseModule],
})
export class EmployeesModule {}
