import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, HydratedDocument } from 'mongoose';
import { Employee } from './schemas/employee.schema';
import { CompleteRegistrationDto } from '../auth/dto/complete-employee-registration.dto';

export type EmployeesDocument = HydratedDocument<Employee>;

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<EmployeesDocument>,
  ) {}

  async findByEmail(email: string): Promise<EmployeesDocument | null> {
    return this.employeeModel.findOne({ email }).exec();
  }

  async create(employeeData: Partial<Employee>): Promise<EmployeesDocument> {
    const newEmployee = new this.employeeModel(employeeData);
    return newEmployee.save();
  }

  async findAll(): Promise<EmployeesDocument[]> {
    return this.employeeModel.find().select('-password').exec();
  }

  async findById(id: string): Promise<EmployeesDocument> {
    const employee = await this.employeeModel
      .findById(id)
      .select('-password -__v')
      .exec();
    if (!employee) {
      throw new NotFoundException(`Співробітника з ID ${id} не знайдено`);
    }
    return employee;
  }

  async update(
    id: string,
    updateData: Partial<CompleteRegistrationDto>,
  ): Promise<EmployeesDocument> {
    const updatedEmployee = await this.employeeModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();

    if (!updatedEmployee) {
      throw new NotFoundException(`Співробітника з ID ${id} не знайдено`);
    }
    return updatedEmployee;
  }

  async delete(id: string): Promise<void> {
    const result = await this.employeeModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Співробітника з ID ${id} не знайдено`);
    }
  }
}
