import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ unique: true, required: true })
  email: string;

  @Prop()
  password?: string;

  @Prop()
  googleId: string;

  @Prop()
  fullName: string;

  @Prop()
  picture: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
