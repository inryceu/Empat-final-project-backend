import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  private async getResourceSecurely(
    id: string,
    companyId: string,
    employeeId: string | null = null,
  ) {
    const query: any = { _id: id, companyId };

    if (employeeId) {
      query.$or = [{ employeeId: null }, { employeeId }];
    }

    const resource = await this.resourceModel.findOne(query).exec();
    if (!resource) {
      throw new NotFoundException('Ресурс не знайдено або у вас немає доступу');
    }
    return resource;
  }

  private async finalizeProcessing(
    resourceId: string,
    companyId: string,
    employeeId: string | null,
    content: string,
  ) {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Не вдалося отримати текст для обробки');
    }

    try {
      await this.aiService.processAndSaveChunks(
        resourceId,
        companyId,
        employeeId,
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

  async findOne(
    id: string,
    companyId: string,
    employeeId: string | null = null,
  ) {
    const resource = await this.getResourceSecurely(id, companyId, employeeId);
    return this.serializeResource(resource);
  }

  async getRawFile(
    id: string,
    companyId: string,
    employeeId: string | null = null,
  ) {
    return this.getResourceSecurely(id, companyId, employeeId);
  }

  async remove(
    id: string,
    companyId: string,
    userId: string,
    userType: 'company' | 'employee',
  ) {
    const query: any = { _id: id, companyId };

    if (userType === 'employee') {
      query.employeeId = userId;
    }

    const resource = await this.resourceModel.findOneAndDelete(query).exec();

    if (!resource) {
      throw new NotFoundException(
        'Ресурс не знайдено або у вас немає прав на його видалення',
      );
    }
  }

  async updateResourceStatus(id: string, statusData: Partial<Resource>) {
    return this.resourceModel
      .findByIdAndUpdate(id, { $set: statusData }, { new: true })
      .exec();
  }

  async processFile(resourceId: string): Promise<void> {
    const resource = await this.resourceModel.findById(resourceId).exec(); // Internal lookup, trusted ID
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

      await this.finalizeProcessing(
        resourceId,
        resource.companyId.toString(),
        resource.employeeId?.toString() || null,
        content,
      );
    } catch (error: any) {
      await this.updateResourceStatus(resourceId, {
        processed: false,
        processingError: error.message || 'Помилка зчитування файлу',
        processedAt: new Date(),
      });
      throw error;
    }
  }

  async processUrl(resourceId: string): Promise<void> {
    const resource = await this.resourceModel.findById(resourceId).exec(); // Internal lookup, trusted ID
    if (!resource || resource.type !== 'url' || !resource.url) {
      throw new Error('Invalid URL resource');
    }

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

      await this.finalizeProcessing(
        resourceId,
        resource.companyId.toString(),
        resource.employeeId?.toString() || null,
        cleanedDocument,
      );
    } catch (error: any) {
      await this.updateResourceStatus(resourceId, {
        processed: false,
        processingError: error.message || 'Помилка скрапінгу URL',
        processedAt: new Date(),
      });
      throw error;
    }
  }
}
