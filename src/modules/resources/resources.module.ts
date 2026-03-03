import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResourcesService } from '../resources/resources.service';
import { Resource, ResourceSchema } from '../resources/schemas/resource.schema';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Resource.name, schema: ResourceSchema }]),
    forwardRef(() => AiModule),
  ],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}