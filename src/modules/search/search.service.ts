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
          port: parseInt(process.env.TYPESENSE_PORT || '8108'),
          protocol: process.env.TYPESENSE_PROTOCOL || 'http',
        },
      ],
      apiKey: process.env.TYPESENSE_API_KEY || 'local-api-key',
      connectionTimeoutSeconds: 2,
    });
  }

  async onModuleInit() {
    await this.initCollection();
  }

  private async initCollection() {
    const collectionName = 'resources';
    try {
      await this.client.collections(collectionName).retrieve();
      this.logger.log(`Колекція ${collectionName} вже існує.`);
    } catch (error) {
      if (error.httpStatus === 404) {
        this.logger.log(`Створення колекції ${collectionName}...`);
        await this.client.collections().create({
          name: collectionName,
          fields: [
            { name: 'title', type: 'string' },
            { name: 'type', type: 'string', facet: true },
            { name: 'companyId', type: 'string', facet: true },
            { name: 'tags', type: 'string[]', facet: true, optional: true },
            {
              name: 'embedding',
              type: 'float[]',
              num_dim: 768,
              optional: true,
            },
          ],
        });
      }
    }
  }

  async upsertResource(document: any) {
    const { fileData, __v, _id, ...rest } = document;

    const typeSenseDoc = {
      ...rest,
      id: _id.toString(),
    };

    try {
      await this.client
        .collections('resources')
        .documents()
        .upsert(typeSenseDoc);
    } catch (error) {
      this.logger.error('Помилка синхронізації з Typesense', error);
    }
  }

  async deleteResource(id: string) {
    try {
      await this.client.collections('resources').documents(id).delete();
    } catch (error) {
      this.logger.error(`Помилка видалення документа ${id} з Typesense`, error);
    }
  }
}
