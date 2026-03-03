import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resource } from './schemas/resource.schema';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(Resource.name) private resourceModel: Model<Resource>,
  ) {}

  async findOne(id: string): Promise<Resource | null> {
    return this.resourceModel.findById(id).exec();
  }
}
