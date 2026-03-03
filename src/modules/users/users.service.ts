import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { User } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

// Додаємо тип Document, щоб Mongoose розумів, що ми працюємо з базою
export type UserDocument = User & Document;

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async create(userData: Partial<User>): Promise<UserDocument> {
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  async findOrCreate(profile: any): Promise<UserDocument> {
    const { id, emails, displayName, photos } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      throw new BadRequestException('Не вдалося отримати email від Google.');
    }

    let user = await this.userModel.findOne({ email }).exec();

    if (user) {
      let isUpdated = false;

      if (!user.googleId) {
        user.googleId = id;
        isUpdated = true;
      }
      if (!user.picture && photos?.[0]?.value) {
        user.picture = photos[0].value;
        isUpdated = true;
      }

      if (isUpdated) {
        await user.save();
      }
    } else {
      user = await this.userModel.create({
        googleId: id,
        email,
        fullName: displayName,
        picture: photos?.[0]?.value,
      });
    }

    return user;
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException(`Користувача з ID ${id} не знайдено`);
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`Користувача з ID ${id} не знайдено`);
    }
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Користувача з ID ${id} не знайдено`);
    }
  }
}
