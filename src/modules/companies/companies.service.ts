import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { Company, CompanyDocument } from './schemas/company.schema';
import { Invite, InviteDocument } from './schemas/invite.schema';
import { RegisterCompanyDto } from '../auth/dto/register-company.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import {
  EmployeesDocument,
  EmployeesService,
} from '../employees/employee.service';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from '../employees/schemas/employee.schema';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Employee.name) private employeeModel: Model<EmployeesDocument>,
    @InjectModel(Invite.name) private inviteModel: Model<InviteDocument>,
    private employeesService: EmployeesService,
  ) {}

  async findInviteByToken(token: string): Promise<InviteDocument | null> {
    return this.inviteModel.findOne({ token }).exec();
  }

  async deleteInvite(id: string): Promise<void> {
    await this.inviteModel.findByIdAndDelete(id).exec();
  }

  private serializeCompany(company: CompanyDocument): any {
    const { _id, password, __v, ...rest } = company.toObject();
    return { id: _id.toString(), ...rest };
  }

  async create(createCompanyDto: Partial<RegisterCompanyDto>): Promise<any> {
    const newCompany = new this.companyModel(createCompanyDto);
    const savedCompany = await newCompany.save();
    return this.serializeCompany(savedCompany);
  }

  async findAll(): Promise<any[]> {
    const companies = await this.companyModel.find().exec();
    return companies.map((c) => this.serializeCompany(c));
  }

  async findOne(id: string): Promise<any> {
    const company = await this.companyModel.findById(id).exec();
    if (!company)
      throw new NotFoundException(`Company with ID ${id} not found`);
    return this.serializeCompany(company);
  }

  async findByEmail(email: string): Promise<CompanyDocument | null> {
    return this.companyModel.findOne({ email }).exec();
  }

  async update(
    id: string,
    updateData: Partial<RegisterCompanyDto>,
  ): Promise<any> {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedCompany = await this.companyModel
      .findByIdAndUpdate(id, { $set: updateData }, { returnDocument: 'after' })
      .exec();

    if (!updatedCompany)
      throw new NotFoundException(`Company with ID ${id} not found`);
    return this.serializeCompany(updatedCompany);
  }

  async delete(id: string): Promise<void> {
    const result = await this.companyModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Company with ID ${id} not found`);
  }

  async getDepartments(companyId: string): Promise<string[]> {
    const company = await this.companyModel.findById(companyId).exec();
    if (!company) {
      throw new NotFoundException('Компанію не знайдено');
    }
    return company.departments || [];
  }

  async addDepartment(
    companyId: string,
    departmentName: string,
  ): Promise<string[]> {
    const company = await this.companyModel.findById(companyId).exec();
    if (!company) {
      throw new NotFoundException('Компанію не знайдено');
    }

    const normalizedName = departmentName.trim();
    if (company.departments.includes(normalizedName)) {
      throw new ConflictException(
        `Відділ "${normalizedName}" вже існує у вашій компанії`,
      );
    }

    company.departments.push(normalizedName);
    await company.save();

    return company.departments;
  }

  async inviteEmployee(companyId: string, dto: CreateInviteDto) {
    const existingEmployee = await this.employeesService.findByEmail(dto.email);
    if (existingEmployee)
      throw new ConflictException('Співробітник з таким email вже існує');

    const existingInvite = await this.inviteModel
      .findOne({ email: dto.email })
      .exec();
    if (existingInvite)
      throw new ConflictException('Запрошення на цю пошту вже відправлено');

    const inviteToken = crypto.randomBytes(32).toString('hex');

    await this.inviteModel.create({
      companyId,
      email: dto.email,
      name: dto.name,
      department: dto.department,
      role: dto.role,
      token: inviteToken,
    });

    return {
      message: 'Запрошення успішно створено',
      inviteLink: `${process.env.FRONTEND_URL}/register-employee?token=${inviteToken}`,
    };
  }

  async updateEmployee(
    companyId: string,
    employeeOrInviteId: string,
    updateData: UpdateEmployeeDto,
  ) {
    if (updateData.email) {
      const emailInEmployees = await this.employeeModel
        .findOne({
          email: updateData.email,
          _id: { $ne: employeeOrInviteId },
        })
        .exec();

      if (emailInEmployees) {
        throw new ConflictException('Співробітник з таким email вже існує.');
      }

      const emailInInvites = await this.inviteModel
        .findOne({
          email: updateData.email,
          _id: { $ne: employeeOrInviteId },
        })
        .exec();

      if (emailInInvites) {
        throw new ConflictException(
          'Запрошення на цю пошту вже відправлено іншому користувачу.',
        );
      }
    }

    const updatedEmployee = await this.employeeModel
      .findOneAndUpdate({ _id: employeeOrInviteId, companyId }, updateData, {
        new: true,
      })
      .select('-password')
      .lean()
      .exec();

    if (updatedEmployee) {
      return {
        message: 'Співробітника оновлено',
        data: updatedEmployee,
        status: 'active',
      };
    }

    const updatedInvite = await this.inviteModel
      .findOneAndUpdate({ _id: employeeOrInviteId, companyId }, updateData, {
        new: true,
      })
      .lean()
      .exec();

    if (updatedInvite) {
      return {
        message: 'Запрошення оновлено',
        data: updatedInvite,
        status: 'pending',
      };
    }

    throw new NotFoundException(
      `Співробітника або запрошення з ID ${employeeOrInviteId} не знайдено`,
    );
  }
}
