import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';

@Injectable()
export class ImageGeneratorService implements OnModuleInit {
  private apiKeys: string[] = [];
  private currentKeyIndex = 0;
  private requestCount = 0;
  private readonly REQUESTS_PER_KEY = 1;

  onModuleInit() {
    const keysString =
      process.env.POLLINATIONS_API_KEYS;

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

      const headers = {
        Authorization: `Bearer ${apiKey}`,
      };

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Pollinations Error Body:', errorText);
        throw new InternalServerErrorException(
          `Сервер повернув помилку: ${response.status} ${response.statusText}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64Content = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/jpeg';

      return `data:${mimeType};base64,${base64Content}`;
    } catch (error: any) {
      console.error('Image Generation Error:', error.message);
      throw new InternalServerErrorException(
        `Не вдалося згенерувати зображення: ${error.message}`,
      );
    }
  }
}