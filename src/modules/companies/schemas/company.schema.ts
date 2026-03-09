import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { tr } from 'zod/v4/locales';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  industry: string;

  @Prop({ required: true })
  size: string;

  @Prop({ required: true })
  contactName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [String], default: [] })
  departments: string[];
}

export const CompanySchema = SchemaFactory.createForClass(Company);
