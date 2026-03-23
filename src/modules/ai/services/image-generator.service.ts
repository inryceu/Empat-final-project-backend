import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImageGeneratorService implements OnModuleInit {
  private apiKeys: string[] = [];
  private currentKeyIndex = 0;
  private requestCount = 0;
  private readonly REQUESTS_PER_KEY = 1;
  private readonly UPLOADS_DIR = path.join(process.cwd(), 'public', 'avatars');

  onModuleInit() {
    const keysString = process.env.POLLINATIONS_API_KEYS;

    if (!keysString) {
      throw new Error(
        'POLLINATIONS_API_KEYS is missing. Please provide comma-separated keys.',
      );
    }

    this.apiKeys = keysString
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (this.apiKeys.length === 0) {
      throw new Error('No valid keys found for Pollinations');
    }

    if (!fs.existsSync(this.UPLOADS_DIR)) {
      fs.mkdirSync(this.UPLOADS_DIR, { recursive: true });
    }
  }

  private getRotatedKey(): string {
    if (this.requestCount >= this.REQUESTS_PER_KEY) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      this.requestCount = 0;
    }

    this.requestCount++;
    return this.apiKeys[this.currentKeyIndex];
  }

  async generateImageBase64(prompt: string): Promise<string> {
    try {
      const safePrompt = prompt
        .replace(/[.,:;?!]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const encodedPrompt = encodeURIComponent(safePrompt);
      const url = `https://gen.pollinations.ai/image/${encodedPrompt}?model=flux`;
      const apiKey = this.getRotatedKey();

      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        throw new InternalServerErrorException(
          `Сервер повернув помилку: ${response.status}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64Content = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/jpeg';

      return `data:${mimeType};base64,${base64Content}`;
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Не вдалося згенерувати зображення: ${error.message}`,
      );
    }
  }

  async generateAndSaveImage(
    prompt: string,
    employeeId: string,
  ): Promise<string> {
    try {
      const safePrompt = prompt
        .replace(/[.,:;?!]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const encodedPrompt = encodeURIComponent(safePrompt);
      const url = `https://gen.pollinations.ai/image/${encodedPrompt}?model=flux`;
      const apiKey = this.getRotatedKey();

      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        throw new InternalServerErrorException(
          `Сервер повернув помилку: ${response.status}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      const extension = mimeType === 'image/png' ? '.png' : '.jpg';

      const fileName = `avatar_${employeeId}_${Date.now()}${extension}`;
      const filePath = path.join(this.UPLOADS_DIR, fileName);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `${process.env.APP_URL || 'http://localhost:3000'}/public/avatars/${fileName}`;

      return publicUrl;
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Не вдалося згенерувати зображення: ${error.message}`,
      );
    }
  }

  saveBase64ToFile(base64String: string, employeeId: string): string {
    const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64String;
    }

    const extension = matches[1] === 'image/png' ? '.png' : '.jpg';
    const buffer = Buffer.from(matches[2], 'base64');

    const fileName = `avatar_${employeeId}_${Date.now()}${extension}`;
    const filePath = path.join(this.UPLOADS_DIR, fileName);

    fs.writeFileSync(filePath, buffer);

    return `${process.env.APP_URL || 'http://localhost:3000'}/public/avatars/${fileName}`;
  }

  convertFileToBase64(fileUrl: string): string {
    const fileName = fileUrl.split('/').pop() ?? ' ';
    const filePath = path.join(this.UPLOADS_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return fileUrl;
    }

    const buffer = fs.readFileSync(filePath);
    const extension = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';

    return `data:${extension};base64,${buffer.toString('base64')}`;
  }
}
