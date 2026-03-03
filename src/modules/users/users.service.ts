import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

async findOrCreate(profile: any): Promise<User> {
    try {
      console.log('--- СТАРТ ФУНКЦІЇ findOrCreate ---');
      
      const { id, emails, displayName, photos } = profile;
      
      const email = emails?.[0]?.value; 

      if (!email) {
        throw new Error('Google не повернув email! Перевір налаштування Scope.');
      }

      console.log(`Шукаємо юзера з email: ${email}`);
      let user = await this.userModel.findOne({ email });

      if (!user) {
        console.log('Юзера не знайдено, створюємо нового...');
        user = await this.userModel.create({
          googleId: id,
          email,
          fullName: displayName,
          picture: photos?.[0]?.value,
        });
        console.log('✅ Нового юзера успішно створено!');
      } else {
        console.log('✅ Старого юзера знайдено в базі!');
      }

      return user;
    } catch (error) {
      console.error('ПОМИЛКА В users.service -> findOrCreate:', error);
      throw error; 
    }
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!updatedUser)
      throw new NotFoundException(`User with ID ${id} not found`);
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`User with ID ${id} not found`);
  }
}
