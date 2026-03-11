import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ResourcesService } from '../../resources/resources.service';
import { CacheService } from '../../cache/services/cache.service';
import { GeminiService } from './gemini.service';
import { DocumentService } from './document.service';
import { ScraperService } from './scraper.service';
import {
  GENERATE_PERSONALIZED_WELCOME,
  SYSTEM_PROMPT,
  WELCOME_SYSTEM_PROMPT,
} from '../constants/prompts.constant';
import { ResourceChunk } from '../schemas/resource-chunk.schema';
import { Resource } from '../../resources/schemas/resource.schema';
import {
  buildContextFromChunks,
  expandQuery,
  findRelevantChunks,
  handleEmptyResults,
  generateGenericWelcome,
} from '../utils/chunks.utils';

import { join } from 'path';

@Injectable()
export class AiService {
  constructor(
    @InjectModel(ResourceChunk.name) private chunkModel: Model<ResourceChunk>,
    @InjectModel(Resource.name) private resourceModel: Model<Resource>,

    @Inject(forwardRef(() => ResourcesService))
    private resourcesService: ResourcesService,

    private cacheService: CacheService,
    private geminiService: GeminiService,
    private documentService: DocumentService,
    private scraperService: ScraperService,
  ) {}

  async getStatus() {
    return this.geminiService.getStatus()
      ? { status: 'OK', message: 'Gemini ready' }
      : { status: 'ERROR', message: 'Gemini isn`t ready' };
  }

  async processFile(resourceId: string): Promise<void> {
    const resource = await this.resourcesService.getRawFile(resourceId);

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

    const fullPath = join(process.cwd(), resource.filePath);

    const content = await this.documentService.extractTextFromFile(
      fullPath,
      resource.fileName,
    );

    if (!content || content.trim().length === 0) {
      throw new BadRequestException(
        'Не вдалося розпізнати текст у цьому файлі',
      );
    }

    await this.processAndSaveChunks(
      resourceId,
      resource.companyId.toString(),
      resource.employeeId?.toString() || null,
      content,
    );
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

      await this.resourceModel
        .updateOne(
          { _id: new Types.ObjectId(resourceId) },
          {
            $set: {
              extractedContent: cleanedDocument,
              extractedAt: new Date(),
              contentLength: cleanedDocument.length,
              fileName: virtualFileName,
              mimeType: 'text/markdown',
              fileSize: Buffer.byteLength(cleanedDocument, 'utf8'),
              originalUrl: resource.url,
            },
          },
        )
        .exec();

      await this.processAndSaveChunks(
        resourceId,
        resource.companyId.toString(),
        resource.employeeId?.toString() || null,
        cleanedDocument,
      );

      await this.resourceModel
        .updateOne(
          { _id: new Types.ObjectId(resourceId) },
          { $set: { processed: true, processedAt: new Date() } },
        )
        .exec();
    } catch (error: any) {
      await this.resourceModel
        .updateOne(
          { _id: new Types.ObjectId(resourceId) },
          {
            $set: {
              processed: false,
              processingError: error.message,
              processedAt: new Date(),
            },
          },
        )
        .exec();
      throw error;
    }
  }

  private async processAndSaveChunks(
    resourceId: string,
    companyId: string,
    employeeId: string | null,
    content: string,
  ): Promise<void> {
    const chunks = await this.documentService.splitIntoChunks(
      content,
      1000,
      150,
    );
    const embeddings = await this.geminiService.generateEmbeddings(chunks);

    const documents = chunks.map((chunk, index) => ({
      resourceId: new Types.ObjectId(resourceId),
      companyId: new Types.ObjectId(companyId),
      employeeId: employeeId ? new Types.ObjectId(employeeId) : null,
      chunkIndex: index,
      chunkText: chunk,
      embedding: embeddings[index],
      createdAt: new Date(),
    }));

    if (documents.length > 0) {
      await this.chunkModel.insertMany(documents);
    }
  }

  async generateResponse(
    query: string,
    companyId: string,
    employeeId: string,
  ): Promise<{ content: string; sources: any[] }> {
    this.cacheService.trackQuery(query, companyId).catch(console.error);
    const cachedResponse = await this.cacheService.getCachedResponse(
      query,
      companyId,
    );
    if (cachedResponse) return cachedResponse;

    const expandedQueries = expandQuery(query);
    const queryEmbeddings =
      await this.geminiService.generateEmbeddings(expandedQueries);

    const relevantChunks = await this.aggregateChunks(
      queryEmbeddings,
      companyId,
      employeeId,
      15,
    );

    if (relevantChunks.length === 0) {
      return handleEmptyResults(this.chunkModel, companyId);
    }

    const { context, resourceTitles, sourcesMap } =
      await buildContextFromChunks(relevantChunks, this.resourceModel);

    const userPrompt = `I have gathered information from ${sourcesMap.size} relevant resource(s):\n${resourceTitles}\n\nHere is the retrieved content:\n\n${context}\n\nUser's question: "${query}"\n\nPlease analyze ALL the provided content and give a comprehensive, helpful answer. Focus on main themes, synthesize information, ignore UI elements, and be conversational.`;

    const content = await this.geminiService.generateContent(
      userPrompt,
      SYSTEM_PROMPT,
    );
    const result = { content, sources: Array.from(sourcesMap.values()) };

    this.cacheService
      .cacheResponse(query, companyId, result)
      .catch(console.error);
    return result;
  }

  async generateWelcomeMessage(data: {
    companyId: string;
    employeeId: string;
    employeeName?: string;
    department?: string;
    tags?: any;
  }): Promise<{ content: string; sources: any[] }> {
    let query = `Welcome! Give me a personalized introduction to the company. I'm ${data.employeeName || 'a new employee'}`;
    if (data.department) query += ` in the ${data.department} department.`;

    const queryEmbeddings = await this.geminiService.generateEmbeddings([
      query,
    ]);
    const relevantChunks = await this.aggregateChunks(
      queryEmbeddings,
      data.companyId,
      data.employeeId,
      15,
    );

    if (relevantChunks.length === 0) {
      return { content: generateGenericWelcome(data), sources: [] };
    }

    const { context, resourceTitles, sourcesMap } =
      await buildContextFromChunks(relevantChunks, this.resourceModel);

    const userPrompt = GENERATE_PERSONALIZED_WELCOME(
      data.employeeName,
      data.department,
      resourceTitles,
      context,
    );

    const content = await this.geminiService.generateContent(
      userPrompt,
      WELCOME_SYSTEM_PROMPT,
    );
    return { content, sources: Array.from(sourcesMap.values()) };
  }

  private async aggregateChunks(
    embeddings: number[][],
    companyId: string,
    employeeId: string,
    limit: number,
  ) {
    const allChunks = new Map<string, any>();
    for (const emb of embeddings) {
      const chunks = await findRelevantChunks(
        this.chunkModel,
        emb,
        companyId,
        employeeId,
        10,
      );
      chunks.forEach((chunk) => {
        const id = `${chunk.resourceId}-${chunk.chunkText.substring(0, 50)}`;
        if (!allChunks.has(id) || allChunks.get(id).score < chunk.score)
          allChunks.set(id, chunk);
      });
    }
    return Array.from(allChunks.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
