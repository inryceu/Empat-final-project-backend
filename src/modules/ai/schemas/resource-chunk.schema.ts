import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ResourceChunk extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Resource' })
  resourceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  companyId: Types.ObjectId;

  @Prop({ required: true })
  chunkText: string;

  @Prop({ type: [Number], required: true })
  embedding: number[];

  @Prop({ required: true })
  chunkIndex: number;
}
export const ResourceChunkSchema = SchemaFactory.createForClass(ResourceChunk);
