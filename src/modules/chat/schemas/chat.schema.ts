import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export class Message {
  @Prop({ required: true, enum: ['employee', 'assistant'] })
  role: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Array, default: [] })
  sources?: any[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

@Schema({ timestamps: true })
export class Chat extends Document {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ type: [Message], default: [] })
  messages: Message[];
}

export const ChatSchema = SchemaFactory.createForClass(Chat);