import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resource, ResourceDocument } from './schemas/resource.schema';
import { CompaniesService } from '../companies/companies.service';
import {
  UploadResourceDto,
  AddUrlResourceDto,
} from './dto/upload-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(Resource.name) private resourceModel: Model<ResourceDocument>,
    private companiesService: CompaniesService,
  ) {}

  private serializeResource(res: ResourceDocument) {
    const { fileData, __v, ...rest } = res.toObject();
    return {
      ...rest,
      id: res._id.toString(),
      fileUrl:
        rest.type === 'file'
          ? `${process.env.FRONTEND_URL}/api/v1/resources/${res._id}/download`
          : undefined,
    };
  }

  async addUrlResource(
    dto: AddUrlResourceDto,
    companyId: string,
    employeeId: string | null = null,
  ) {
    try {
      new URL(dto.url);
    } catch {
      throw new BadRequestException('Невалідний формат URL');
    }

    const newResource = await this.resourceModel.create({
      type: 'url',
      title: dto.title,
      url: dto.url,
      companyId,
      employeeId,
      tags: [],
    });

    return this.serializeResource(newResource);
  }

  async uploadFile(
    file: Express.Multer.File,
    dto: UploadResourceDto,
    companyId: string,
    employeeId: string | null = null,
  ) {
    const newResource = await this.resourceModel.create({
      type: 'file',
      title: dto.title || file.originalname,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      fileData: file.buffer,
      companyId,
      employeeId,
      tags: [],
    });

    return this.serializeResource(newResource);
  }

  async getCompanyGlobalResources(companyId: string) {
    const resources = await this.resourceModel
      .find({
        companyId,
        employeeId: null,
      })
      .exec();
    return resources.map((res) => this.serializeResource(res));
  }

  async getEmployeeResources(companyId: string, employeeId: string) {
    const resources = await this.resourceModel
      .find({
        companyId,
        $or: [{ employeeId: null }, { employeeId: employeeId }],
      })
      .exec();
    return resources.map((res) => this.serializeResource(res));
  }

  async findOne(id: string) {
    const resource = await this.resourceModel.findById(id).exec();
    if (!resource) throw new NotFoundException('Ресурс не знайдено');

    return this.serializeResource(resource);
  }

  async remove(id: string, userId: string, userType: 'company' | 'employee') {
    const resource = await this.resourceModel.findById(id).exec();
    if (!resource) throw new NotFoundException('Ресурс не знайдено');

    if (userType === 'employee' && resource.employeeId?.toString() !== userId) {
      throw new BadRequestException('Ви можете видаляти лише власні ресурси');
    }

    await this.resourceModel.findByIdAndDelete(id).exec();
  }

  async getRawFile(id: string) {
    return this.resourceModel.findById(id).exec();
  }
}
