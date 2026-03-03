import { Injectable, OnModuleInit } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class GeminiService implements OnModuleInit {
  private genAI: GoogleGenerativeAI;
  private embeddingModel: GenerativeModel;

  onModuleInit() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      throw new Error('GEMINI_API_KEY is missing in environment variables');

    this.genAI = new GoogleGenerativeAI(apiKey);

    this.embeddingModel = this.genAI.getGenerativeModel({
      model: 'gemini-embedding-001',
    });
  }

  getStatus(): boolean {
    return !!this.genAI;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(
      texts.map(async (text) => {
        const result = await this.embeddingModel.embedContent(text);
        return result.embedding.values;
      }),
    );
    return embeddings;
  }

  async generateContent(
    userPrompt: string,
    systemInstruction: string,
  ): Promise<string> {
    const modelWithSystem = this.genAI.getGenerativeModel({
      model: 'gemini-3.1-flash',
      systemInstruction: systemInstruction,
    });

    const result = await modelWithSystem.generateContent(userPrompt);
    return result.response.text();
  }
}
