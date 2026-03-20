import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type EmployeesDocument = HydratedDocument<Employee>;

@Schema({ timestamps: true })
export class Employee {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password?: string;

  @Prop({ required: true })
  department: string;

  @Prop({
    required: true,
    enum: ['trainee', 'junior', 'middle', 'senior', 'lead', 'head', 'CTO'],
  })
  role: string;

  @Prop({
    enum: ['male', 'female', 'other', 'preferNotToSay'],
  })
  gender: string;

  @Prop()
  hobbies: string;

  @Prop()
  favoriteAnimal: string;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: mongoose.Schema.Types.ObjectId | string;

  @Prop({ required: false })
  avatarUrl?: string;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
