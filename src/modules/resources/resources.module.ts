import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { Resource, ResourceSchema } from './schemas/resource.schema';
import { SearchModule } from '../search/search.module';
import { CompaniesModule } from '../companies/companies.module';
import { SearchService } from '../search/search.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    SearchModule,
    CompaniesModule,
    forwardRef(() => AiModule),
    MongooseModule.forFeatureAsync([
      {
        name: Resource.name,
        imports: [SearchModule],
        inject: [SearchService],
        useFactory: (searchService: SearchService) => {
          const schema = ResourceSchema;

          schema.post('save', async function (doc) {
            await searchService.upsertResource(doc.toObject());
          });

          schema.post('findOneAndDelete', async function (doc) {
            if (doc) {
              await searchService.deleteResource(doc._id.toString());
            }
          });

          return schema;
        },
      },
    ]),
  ],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}
