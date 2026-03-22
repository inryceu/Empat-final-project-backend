import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class ImageGeneratorService {
  async generateImageBase64(prompt: string): Promise<string> {
    try {
      const safePrompt = prompt
        .replace(/[.,:;?!]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const encodedPrompt = encodeURIComponent(safePrompt);

      const url = `https://gen.pollinations.ai/image/${encodedPrompt}?model=flux`;

      console.log(`Генеруємо зображення: ${url}`);

      const apiKey = process.env.POLLINATIONS_API_KEY;

      if (!apiKey) {
        throw new Error(
          'API ключ POLLINATIONS_API_KEY не знайдено у змінних середовища.',
        );
      }

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
        throw new Error(
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
