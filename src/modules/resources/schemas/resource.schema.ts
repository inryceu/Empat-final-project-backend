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

  // ⚠️ Увага: MongoDB має ліміт 16MB на документ.
  // Зберігати буфер у базі ок для дрібних файлів, але для великих краще S3 або GridFS.
  @Prop({ type: Buffer })
  fileData?: Buffer;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [Number], default: [] })
  embedding?: number[];
}


export const ResourceSchema = SchemaFactory.createForClass(Resource);
