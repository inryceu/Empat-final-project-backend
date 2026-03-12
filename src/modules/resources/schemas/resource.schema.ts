import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ResourceDocument = HydratedDocument<Resource>;

@Schema({ timestamps: true })
export class Resource {
  @Prop({ required: true, enum: ['file', 'url'] })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  })
  companyId: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null,
  })
  employeeId: string | null;

  @Prop()
  url?: string;

  @Prop()
  fileName?: string;

  @Prop()
  mimeType?: string;

  @Prop()
  fileSize?: number;

  @Prop({ required: false })
  filePath?: string;

  @Prop({ type: [Number], default: [] })
  embedding?: number[];

  @Prop({ default: false })
  processed: boolean;

  @Prop()
  processedAt?: Date;

  @Prop()
  processingError?: string;

  @Prop()
  extractedContent?: string;

  @Prop()
  extractedAt?: Date;

  @Prop()
  contentLength?: number;

  @Prop()
  originalUrl?: string;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);
