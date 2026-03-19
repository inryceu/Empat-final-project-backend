import { Injectable, OnModuleInit } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class GeminiService implements OnModuleInit {
  private clients: GoogleGenerativeAI[] = [];
  private currentClientIndex = 0;
  private requestCount = 0;
  private readonly REQUESTS_PER_KEY = 5;

  onModuleInit() {
    const keysString = process.env.GEMINI_API_KEYS;
    if (!keysString) {
      throw new Error(
        'GEMINI_API_KEYS is missing. Please provide comma-separated keys.',
      );
    }

    const keys = keysString
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keys.length === 0) {
      throw new Error('No valid keys found in GEMINI_API_KEYS');
    }

    this.clients = keys.map((key) => new GoogleGenerativeAI(key));
  }

  getStatus(): boolean {
    return this.clients.length > 0;
  }

  private getRotatedModel(modelConfig: {
    model: string;
    systemInstruction?: string;
  }): GenerativeModel {
    if (this.requestCount >= this.REQUESTS_PER_KEY) {
      this.currentClientIndex =
        (this.currentClientIndex + 1) % this.clients.length;
      this.requestCount = 0;
    }

    this.requestCount++;
    const currentClient = this.clients[this.currentClientIndex];

    return currentClient.getGenerativeModel(modelConfig);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    const BATCH_SIZE = 5;
    const DELAY_MS = 1000;

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (text) => {
          const model = this.getRotatedModel({ model: 'gemini-embedding-001' });
          const result = await model.embedContent(text);
          return result.embedding.values;
        }),
      );

      embeddings.push(...batchResults);

      if (i + BATCH_SIZE < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    return embeddings;
  }

  async generateContent(
    userPrompt: string,
    systemInstruction: string,
  ): Promise<string> {
    const model = this.getRotatedModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent(userPrompt);
    return result.response.text();
  }

  async generateImage(prompt: string): Promise<string> {
    const model = this.getRotatedModel({ model: 'gemini-2.5-flash-image' });

    try {
      const result = await model.generateContent(`Generate an image based on this description: ${prompt}`);
      const response = await result.response;

      const imagePart = response.candidates?.[0]?.content?.parts?.find(
        (part) => part.inlineData && part.inlineData.mimeType.startsWith('image/')
      );

      if (imagePart?.inlineData) {
        return imagePart.inlineData.data;
      } else {
        console.warn('Текстова відповідь моделі замість картинки:', response.text());
        throw new Error('API не повернуло зображення. Перевірте промпт або ліміти ключа.');
      }
    } catch (error: any) {
      console.error('Gemini Image Generation Error:', error);
      throw new Error(`Помилка генерації зображення: ${error.message}`);
    }
  }
}
