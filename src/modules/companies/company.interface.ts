import { ObjectId } from 'mongodb';

export interface Company {
  _id?: ObjectId;
  name: string;
  industry: string;
  size: string;
  contactName: string;
  email: string;
  password?: string;
  createdAt: Date;
}
