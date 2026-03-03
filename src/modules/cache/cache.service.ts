import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  async trackQuery(query: string, companyId: string): Promise<void> {
    console.log(`Tracked query: ${query}`);
  }

  async getCachedResponse(
    query: string,
    companyId: string,
  ): Promise<any | null> {
    return null;
  }

  async cacheResponse(
    query: string,
    companyId: string,
    response: any,
  ): Promise<void> {}
}
