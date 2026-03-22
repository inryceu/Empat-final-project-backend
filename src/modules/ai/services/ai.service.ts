import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CacheService } from '../../cache/services/cache.service';
import { GeminiService } from './gemini.service';
import { DocumentService } from './document.service';
import {
  GENERATE_PERSONALIZED_WELCOME,
  SYSTEM_PROMPT,
  WELCOME_SYSTEM_PROMPT,
  generateAvatarPrompt,
} from '../constants/prompts.constant';
import { ResourceChunk } from '../schemas/resource-chunk.schema';
import { Resource } from '../../resources/schemas/resource.schema';
import {
  buildContextFromChunks,
  expandQuery,
  handleEmptyResults,
  generateGenericWelcome,
} from '../utils/chunks.utils';
import { SearchService } from '../../search/search.service';
import { ImageGeneratorService } from './image-generator.service';
import { EmployeesService } from '../../employees/employee.service';
import { ChatService } from '../../chat/chat.service';

@Injectable()
export class AiService {
  constructor(
    @InjectModel(ResourceChunk.name) private chunkModel: Model<ResourceChunk>,
    @InjectModel(Resource.name) private resourceModel: Model<Resource>,
    private searchService: SearchService,
    private cacheService: CacheService,
    private geminiService: GeminiService,
    private documentService: DocumentService,
    private readonly imageGeneratorService: ImageGeneratorService,
    private readonly employeesService: EmployeesService,
    private readonly chatService: ChatService,
  ) {}

  async getStatus() {
    return this.geminiService.getStatus()
      ? { status: 'OK', message: 'Gemini ready' }
      : { status: 'ERROR', message: 'Gemini isn`t ready' };
  }

  async processAndSaveChunks(
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
      const savedDocs = await this.chunkModel.insertMany(documents);
      await this.searchService.upsertChunks(savedDocs);
    }
  }

  async generateSingleEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.geminiService.generateEmbeddings([text]);
    return embeddings[0] || [];
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
    if (cachedResponse) {
      this.chatService
        .saveMessagePair(employeeId, query, cachedResponse.content, cachedResponse.sources)
        .catch((err) => console.error('Помилка збереження чату:', err));

      return cachedResponse;
    }

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
      const emptyResult = await handleEmptyResults(this.chunkModel, companyId);

      this.chatService
        .saveMessagePair(employeeId, query, emptyResult.content, emptyResult.sources)
        .catch((err) => console.error('Помилка збереження чату:', err));

      return emptyResult;
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

    this.chatService
      .saveMessagePair(employeeId, query, content, result.sources)
      .catch((err) => console.error('Помилка збереження чату:', err));

    return result;
  }

  async generateWelcomeMessage(data: {
    companyId: string;
    employeeId: string | null;
    employeeName?: string;
    department?: string;
  }): Promise<{ content: string; sources: any[] }> {
    const userId = data.employeeId || data.companyId;

    const cachedWelcome = await this.chatService.getWelcomeMessage(userId);
    if (cachedWelcome) {
      return { content: cachedWelcome, sources: [] };
    }

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
      const genericContent = generateGenericWelcome(data);

      await this.chatService.saveWelcomeMessage(userId, genericContent);
      return { content: genericContent, sources: [] };
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

    await this.chatService.saveWelcomeMessage(userId, content);

    return { content, sources: Array.from(sourcesMap.values()) };
  }

  private async aggregateChunks(
    embeddings: number[][],
    companyId: string,
    employeeId: string | null,
    limit: number,
  ) {
    const allChunks = new Map<string, any>();

    for (const emb of embeddings) {
      const chunks = await this.searchService.searchChunksByVector(
        emb,
        companyId,
        employeeId,
        10,
      );

      chunks.forEach((chunk) => {
        const id = `${chunk.resourceId}-${chunk.chunkText.substring(0, 50)}`;
        if (!allChunks.has(id) || allChunks.get(id).score < chunk.score) {
          allChunks.set(id, chunk);
        }
      });
    }

    return Array.from(allChunks.values())
      .sort((a, b) => a.score - b.score)
      .slice(0, limit);
  }

  async getOrGenerateAvatar(companyId: string, employeeId: string) {
    const employee = await this.employeesService.findById(
      companyId,
      employeeId,
    );

    if (!employee) throw new NotFoundException('Співробітника не знайдено');
    if (employee.avatarUrl)
      return { isNew: false, avatarUrl: employee.avatarUrl };

    const promptData = { ...employee };

    const cyrillicRegex = /[а-яА-ЯіІїЇєЄґҐ]/;
    const translateInstruction =
      'Translate this word/phrase to English. Return ONLY the translation, nothing else.';

    if (
      promptData.favoriteAnimal &&
      cyrillicRegex.test(promptData.favoriteAnimal)
    ) {
      try {
        promptData.favoriteAnimal = await this.geminiService.generateContent(
          promptData.favoriteAnimal,
          translateInstruction,
        );
      } catch (e) {
        console.warn('Помилка перекладу тварини');
      }
    }

    if (promptData.hobbies && cyrillicRegex.test(promptData.hobbies)) {
      try {
        promptData.hobbies = await this.geminiService.generateContent(
          promptData.hobbies,
          translateInstruction,
        );
      } catch (e) {
        console.warn('Помилка перекладу хобі');
      }
    }

    const prompt = generateAvatarPrompt(promptData);

    const publicUrl =
      await this.imageGeneratorService.generateImageBase64(prompt);

    await this.employeesService.updateAvatar(employeeId, publicUrl);

    return { isNew: true, avatarUrl: publicUrl };
  }
}
