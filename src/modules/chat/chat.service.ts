import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat } from './schemas/chat.schema';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Chat.name) private chatModel: Model<Chat>) {}

  async getHistory(userId: string) {
    const chat = await this.chatModel.findOne({ userId }).lean();
    return chat ? chat.messages : [];
  }

  async saveMessagePair(userId: string, userMsg: string, aiMsg: string) {
    await this.chatModel.updateOne(
      { userId },
      {
        $push: {
          messages: {
            $each: [
              { role: 'user', content: userMsg, createdAt: new Date() },
              { role: 'assistant', content: aiMsg, createdAt: new Date() },
            ],
          },
        },
      },
      { upsert: true }
    );
  }

  async getWelcomeMessage(userId: string): Promise<string | null> {
    const chat = await this.chatModel.findOne({ userId }).lean();
    if (chat && chat.messages.length > 0) {
      return chat.messages[0].content;
    }
    return null;
  }

  async saveWelcomeMessage(userId: string, content: string) {
    await this.chatModel.updateOne(
      { userId },
      {
        $push: {
          messages: {
            $each: [{ role: 'assistant', content, createdAt: new Date() }],
            $position: 0, 
          },
        },
      },
      { upsert: true }
    );
  }
}