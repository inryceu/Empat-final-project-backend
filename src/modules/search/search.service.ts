import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Client } from 'typesense';

@Injectable()
export class SearchService implements OnModuleInit {
  private client: Client;
  private readonly logger = new Logger(SearchService.name);

  constructor() {
    this.client = new Client({
      nodes: [
        {
          host: process.env.TYPESENSE_HOST || 'localhost',
          port: parseInt(process.env.TYPESENSE_PORT || '8080'),
          protocol: process.env.TYPESENSE_PROTOCOL || 'http',
        },
      ],
      apiKey: process.env.TYPESENSE_API_KEY || 'local-api-key',
      connectionTimeoutSeconds: 3,
    });
  }

  async onModuleInit() {
    await this.initCollections();
  }

  private async initCollections() {
    const EMBEDDING_DIMENSION = 3072;

    const schemas = [
      {
        name: 'resources',
        fields: [
          { name: 'title', type: 'string' },
          { name: 'type', type: 'string', facet: true },
          { name: 'companyId', type: 'string', facet: true },
          {
            name: 'embedding',
            type: 'float[]',
            num_dim: EMBEDDING_DIMENSION,
            optional: true,
          },
        ],
      },
      {
        name: 'resource_chunks',
        fields: [
          { name: 'resourceId', type: 'string', facet: true },
          { name: 'companyId', type: 'string', facet: true },
          { name: 'employeeId', type: 'string', facet: true },
          { name: 'chunkIndex', type: 'int32' },
          { name: 'chunkText', type: 'string' },
          { name: 'embedding', type: 'float[]', num_dim: EMBEDDING_DIMENSION },
        ],
      },
    ];

    const maxRetries = 7;
    let isConnected = false;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.client.health.retrieve();
        this.logger.log('Typesense is ready. Proceeding with collections...');
        isConnected = true;
        break;
      } catch (error) {
        if (attempt === maxRetries) {
          this.logger.error(
            'Failed to connect to Typesense after multiple attempts.',
          );
          return;
        }
        this.logger.warn(
          `Typesense not ready, retrying in 3s (Attempt ${attempt}/${maxRetries})...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    if (!isConnected) return;

    for (const schema of schemas) {
      try {
        await this.client.collections(schema.name).retrieve();
        this.logger.log(`Колекція ${schema.name} вже існує.`);
      } catch (error: any) {
        if (error.httpStatus === 404) {
          this.logger.log(`Створення колекції ${schema.name}...`);
          await this.client.collections().create(schema as any);
        } else {
          this.logger.error(`Помилка перевірки колекції ${schema.name}`, error);
        }
      }
    }
  }

  async upsertResource(document: any) {
    const { __v, _id, ...rest } = document;
    try {
      await this.client
        .collections('resources')
        .documents()
        .upsert({ ...rest, id: _id.toString() });
    } catch (error) {
      this.logger.error('Помилка синхронізації з Typesense', error);
    }
  }

  async deleteResource(id: string) {
    try {
      await this.client.collections('resources').documents(id).delete();
      await this.client
        .collections('resource_chunks')
        .documents()
        .delete({
          filter_by: `resourceId:=${id}`,
        });
    } catch (error) {
      this.logger.error(`Помилка видалення документа ${id} з Typesense`, error);
    }
  }

  async upsertChunks(chunks: any[]) {
    if (!chunks || chunks.length === 0) return;

    const typesenseDocs = chunks.map((chunk, i) => {
      const doc: any = {
        id: chunk._id ? chunk._id.toString() : `${chunk.resourceId}-${i}`,
        resourceId: chunk.resourceId.toString(),
        companyId: chunk.companyId.toString(),
        employeeId: chunk.employeeId ? chunk.employeeId.toString() : 'GLOBAL',
        chunkIndex: chunk.chunkIndex,
        chunkText: chunk.chunkText,
        embedding: chunk.embedding,
      };
      return doc;
    });

    try {
      await this.client
        .collections('resource_chunks')
        .documents()
        .import(typesenseDocs, { action: 'upsert' });
      this.logger.log(
        `Успішно імпортовано ${typesenseDocs.length} чанків у Typesense`,
      );
    } catch (error) {
      this.logger.error('Помилка імпорту чанків у Typesense', error);
    }
  }

  async searchChunksByVector(
    embedding: number[],
    companyId: string,
    employeeId: string | null,
    limit: number = 10,
  ) {
    // Базовий фільтр: шукаємо тільки в межах конкретної компанії
    let filterBy = `companyId:=${companyId}`;

    if (employeeId) {
      // Працівник шукає: він має бачити СВОЇ файли + ЗАГАЛЬНІ файли компанії
      filterBy += ` && employeeId:=[${employeeId}, GLOBAL]`;
    } else {
      // Якщо пошук робить система/адмін без прив'язки до працівника, 
      // шукаємо тільки по загальних файлах (або можна прибрати цей else, щоб шукати по всіх)
      filterBy += ` && employeeId:=GLOBAL`;
    }

    const searchRequest = {
      collection: 'resource_chunks',
      q: '*',
      vector_query: `embedding:([${embedding.join(',')}], k:${limit})`,
      filter_by: filterBy,
    };

    try {
      const result = await this.client.multiSearch.perform(
        { searches: [searchRequest] },
        { query_by: 'chunkText' },
      );

      const firstResult = result.results[0] as any;

      return (firstResult.hits || []).map((hit: any) => ({
        resourceId: hit.document.resourceId,
        chunkText: hit.document.chunkText,
        score: hit.vector_distance || 0,
      }));
    } catch (error) {
      this.logger.error('Typesense Vector Search Error:', error);
      return [];
    }
  }
}
