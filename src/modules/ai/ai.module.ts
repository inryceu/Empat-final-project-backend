import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { AiService } from './services/ai.service';
import { GeminiService } from './services/gemini.service';
import { DocumentService } from './services/document.service';
import { ScraperService } from './services/scraper.service';
import {
  ResourceChunk,
  ResourceChunkSchema,
} from './schemas/resource-chunk.schema';
import {
  Resource,
  ResourceSchema,
} from '../../modules/resources/schemas/resource.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ResourceChunk.name, schema: ResourceChunkSchema },
      { name: Resource.name, schema: ResourceSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService, GeminiService, DocumentService, ScraperService],
  exports: [AiService],
})
export class AiModule {}
