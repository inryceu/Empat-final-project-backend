import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Resource extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  companyId: Types.ObjectId;

  @Prop({ required: true, enum: ['file', 'url'] })
  type: string;

  @Prop()
  title?: string;

  @Prop()
  url?: string;

  @Prop()
  fileName?: string;

  @Prop({ type: Buffer })
  fileData?: Buffer;

  @Prop({ default: false })
  processed: boolean;

  @Prop()
  processingError?: string;
}
export const ResourceSchema = SchemaFactory.createForClass(Resource);
