import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, {HydratedDocument} from 'mongoose';
import { EmployeeRole } from 'src/modules/employees/dto/enums';

export type InviteDocument = HydratedDocument<Invite>;

@Schema({ timestamps: true })
export class Invite {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true })
  companyId: string; 

  @Prop({ required: true })
  name: string;

  @Prop({ type: [String], required: true })
  departments: string[];

  @Prop({ required: true, enum: EmployeeRole })
  role: EmployeeRole;
}
export const InviteSchema = SchemaFactory.createForClass(Invite);