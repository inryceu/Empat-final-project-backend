import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Company, CompanyDocument } from './schemas/company.schema';
import { CreateCompanyDto, LoginCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  private serializeCompany(company: CompanyDocument): any {
    const obj = company.toObject ? company.toObject() : company;
    const { _id, password, ...rest } = obj;

    return {
      id: _id.toString(),
      ...rest,
    };
  }

  async create(createCompanyDto: CreateCompanyDto): Promise<any> {
    const hashedPassword = createCompanyDto.password
      ? await bcrypt.hash(createCompanyDto.password, 10)
      : undefined;

    const newCompany = new this.companyModel({
      ...createCompanyDto,
      password: hashedPassword,
    });

    const savedCompany = await newCompany.save();
    return this.serializeCompany(savedCompany);
  }

  async login(loginDto: LoginCompanyDto): Promise<any> {
    const company = await this.findByEmail(loginDto.email);

    if (!company) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      company.password || '',
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.serializeCompany(company as CompanyDocument);
  }

  async findAll(): Promise<any[]> {
    const companies = await this.companyModel.find().exec();
    return companies.map((c) => this.serializeCompany(c));
  }

  async findOne(id: string): Promise<any> {
    const company = await this.companyModel.findById(id).exec();

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return this.serializeCompany(company);
  }

  async findByEmail(email: string): Promise<CompanyDocument | null> {
    return this.companyModel.findOne({ email }).exec();
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.companyModel.countDocuments({ _id: id }).exec();
    return count > 0;
  }

  async update(
    id: string,
    updateData: Partial<CreateCompanyDto>,
  ): Promise<any> {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedCompany = await this.companyModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updatedCompany) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return this.serializeCompany(updatedCompany);
  }

  async delete(id: string): Promise<void> {
    const result = await this.companyModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
  }
}
