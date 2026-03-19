import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, HydratedDocument } from 'mongoose';
import { Employee } from './schemas/employee.schema';
import { Invite } from '../companies/schemas/invite.schema';
import { CompleteRegistrationDto } from '../auth/dto/complete-employee-registration.dto';

export type EmployeesDocument = HydratedDocument<Employee>;
export type InviteDocument = HydratedDocument<Invite>;

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<EmployeesDocument>,
    @InjectModel(Invite.name) private inviteModel: Model<InviteDocument>,
  ) {}

  async findByIdForAuth(id: string): Promise<EmployeesDocument | null> {
    return this.employeeModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<EmployeesDocument | null> {
    return this.employeeModel.findOne({ email }).exec();
  }

  async create(employeeData: Partial<Employee>): Promise<EmployeesDocument> {
    const newEmployee = new this.employeeModel(employeeData);
    return newEmployee.save();
  }

  async findAll(companyId: string): Promise<any[]> {
    const employees = await this.employeeModel
      .find({ companyId })
      .select('-password -__v')
      .lean()
      .exec();

    const invites = await this.inviteModel
      .find({ companyId })
      .select('-__v -token')
      .lean()
      .exec();

    return [
      ...employees.map((e) => ({ ...e, status: 'active' })),
      ...invites.map((i) => ({ ...i, status: 'pending' })),
    ];
  }

  async findById(companyId: string, id: string): Promise<any> {
    const employee = await this.employeeModel
      .findOne({ _id: id, companyId })
      .select('-password -__v')
      .lean()
      .exec();

    if (employee) return { ...employee, status: 'active' };

    const invite = await this.inviteModel
      .findOne({ _id: id, companyId })
      .select('-__v -token')
      .lean()
      .exec();

    if (invite) return { ...invite, status: 'pending' };

    throw new NotFoundException(
      `Співробітника або запрошення з ID ${id} не знайдено`,
    );
  }

  async update(
    companyId: string,
    id: string,
    updateData: Partial<CompleteRegistrationDto>,
  ): Promise<any> {
    const updatedEmployee = await this.employeeModel
      .findOneAndUpdate({ _id: id, companyId }, updateData, { new: true })
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
      .findOneAndUpdate({ _id: id, companyId }, updateData, { new: true })
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
      `Співробітника або запрошення з ID ${id} не знайдено`,
    );
  }

  async delete(companyId: string, id: string): Promise<{ message: string }> {
    const deletedEmployee = await this.employeeModel
      .findOneAndDelete({ _id: id, companyId })
      .exec();

    if (deletedEmployee) return { message: 'Співробітника успішно видалено' };

    const deletedInvite = await this.inviteModel
      .findOneAndDelete({ _id: id, companyId })
      .exec();

    if (deletedInvite) return { message: 'Запрошення успішно скасовано' };

    throw new NotFoundException(
      `Співробітника або запрошення з ID ${id} не знайдено`,
    );
  }

  async updateAvatar(employeeId: string, avatarUrl: string): Promise<void> {
    const updatedEmployee = await this.employeeModel
      .findByIdAndUpdate(
        employeeId,
        { $set: { avatarUrl } },
        { returnDocument: 'after' },
      )
      .exec();

    if (!updatedEmployee) {
      throw new NotFoundException(
        `Співробітника з ID ${employeeId} не знайдено`,
      );
    }
  }
}
