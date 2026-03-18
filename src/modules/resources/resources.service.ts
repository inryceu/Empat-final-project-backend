// src/modules/resources/resources.service.ts
import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { join } from 'path';
import { Resource, ResourceDocument } from './schemas/resource.schema';
import {
  UploadResourceDto,
  AddUrlResourceDto,
} from './dto/upload-resource.dto';
import { AiService } from '../ai/services/ai.service';
import { DocumentService } from '../ai/services/document.service';
import { ScraperService } from '../ai/services/scraper.service';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(Resource.name) private resourceModel: Model<ResourceDocument>,
    @Inject(forwardRef(() => DocumentService))
    private documentService: DocumentService,

    @Inject(forwardRef(() => ScraperService))
    private scraperService: ScraperService,

    @Inject(forwardRef(() => AiService))
    private aiService: AiService,
  ) {}

  private serializeResource(res: ResourceDocument) {
    const { __v, embedding, _id, ...rest } = res.toObject();
    return {
      ...rest,
      id: _id.toString(),
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

    const titleEmbedding = await this.aiService.generateSingleEmbedding(
      dto.title,
    );

    const newResource = await this.resourceModel.create({
      type: 'url',
      title: dto.title,
      url: dto.url,
      companyId,
      employeeId,
      embedding: titleEmbedding,
    });

    this.processUrl(newResource._id.toString()).catch((err) =>
      console.error(`AI failed for URL ${newResource._id}:`, err),
    );
    return this.serializeResource(newResource);
  }

  async uploadFile(
    file: Express.Multer.File,
    dto: UploadResourceDto,
    companyId: string,
    employeeId: string | null = null,
  ) {
    const title = dto.title || file.originalname;
    const titleEmbedding = await this.aiService.generateSingleEmbedding(title);

    const newResource = await this.resourceModel.create({
      type: 'file',
      title: title,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      filePath: file.path,
      companyId,
      employeeId,
      embedding: titleEmbedding,
    });

    this.processFile(newResource._id.toString()).catch((err) =>
      console.error(`AI failed for File ${newResource._id}:`, err),
    );
    return this.serializeResource(newResource);
  }

  async getCompanyGlobalResources(companyId: string) {
    const resources = await this.resourceModel
      .find({ companyId, employeeId: null })
      .exec();
    return resources.map((res) => this.serializeResource(res));
  }

  async getEmployeeResources(companyId: string, employeeId: string) {
    const resources = await this.resourceModel
      .find({ companyId, $or: [{ employeeId: null }, { employeeId }] })
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

  async updateResourceStatus(id: string, statusData: Partial<Resource>) {
    return this.resourceModel
      .findByIdAndUpdate(id, { $set: statusData }, { new: true })
      .exec();
  }

  async processFile(resourceId: string): Promise<void> {
    const resource = await this.getRawFile(resourceId);
    if (
      !resource ||
      resource.type !== 'file' ||
      !resource.filePath ||
      !resource.fileName
    ) {
      throw new BadRequestException(
        'Invalid resource type or missing data/filename for file processing',
      );
    }

    try {
      const fullPath = join(process.cwd(), resource.filePath);
      const content = await this.documentService.extractTextFromFile(
        fullPath,
        resource.fileName,
      );

      if (!content || content.trim().length === 0)
        throw new BadRequestException('Не вдалося розпізнати текст у файлі');

      await this.aiService.processAndSaveChunks(
        resourceId,
        resource.companyId.toString(),
        resource.employeeId?.toString() || null,
        content,
      );
      await this.updateResourceStatus(resourceId, {
        processed: true,
        processedAt: new Date(),
      });
    } catch (error: any) {
      await this.updateResourceStatus(resourceId, {
        processed: false,
        processingError: error.message,
        processedAt: new Date(),
      });
      throw error;
    }
  }

  async processUrl(resourceId: string): Promise<void> {
    const resource = await this.resourceModel.findById(resourceId).exec();
    if (!resource || resource.type !== 'url' || !resource.url)
      throw new Error('Invalid URL resource');

    try {
      const cleanedDocument = await this.scraperService.scrapeWebPage(
        resource.url,
        resource.title,
      );
      const virtualFileName = `${resource.title?.replace(/[^a-zA-Z0-9-_]/g, '_') || 'page'}_from_url.md`;

      await this.updateResourceStatus(resourceId, {
        extractedContent: cleanedDocument,
        extractedAt: new Date(),
        contentLength: cleanedDocument.length,
        fileName: virtualFileName,
        mimeType: 'text/markdown',
        fileSize: Buffer.byteLength(cleanedDocument, 'utf8'),
        originalUrl: resource.url,
      });

      await this.aiService.processAndSaveChunks(
        resourceId,
        resource.companyId.toString(),
        resource.employeeId?.toString() || null,
        cleanedDocument,
      );
      await this.updateResourceStatus(resourceId, {
        processed: true,
        processedAt: new Date(),
      });
    } catch (error: any) {
      await this.updateResourceStatus(resourceId, {
        processed: false,
        processingError: error.message,
        processedAt: new Date(),
      });
      throw error;
    }
  }
}
