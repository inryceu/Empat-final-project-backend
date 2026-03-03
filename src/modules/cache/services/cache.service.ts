import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { RedisService } from './redis.service';

export interface CachedResponse {
  content: string;
  sources: any[];
  cachedAt: Date;
}

export interface PopularQuestion {
  query: string;
  companyId: string;
  count: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly CACHE_TTL = 3600;
  private readonly CACHE_PREFIX = 'ai:chat:';
  private readonly STATS_PREFIX = 'ai:stats:';
  private readonly POPULAR_KEY = 'ai:popular';

  constructor(private readonly redisService: RedisService) {}

  private generateHash(query: string, companyId: string): string {
    const normalizedQuery = query.trim().toLowerCase();
    return crypto
      .createHash('md5')
      .update(`${normalizedQuery}:${companyId}`)
      .digest('hex');
  }

  async getCachedResponse(
    query: string,
    companyId: string,
  ): Promise<any | null> {
    const hash = this.generateHash(query, companyId);

    try {
      const cached = await this.redisService.get(`${this.CACHE_PREFIX}${hash}`);
      if (cached) {
        this.logger.log(`Cache HIT for query: "${query.substring(0, 50)}..."`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn(
        `Redis is unavailable (GET). Proceeding without cache...`,
      );
    }

    this.logger.log(
      `Cache MISS or error for query: "${query.substring(0, 50)}..."`,
    );
    return null;
  }

  async cacheResponse(
    query: string,
    companyId: string,
    response: { content: string; sources: any[] },
  ): Promise<void> {
    const hash = this.generateHash(query, companyId);
    const cachedData = { ...response, cachedAt: new Date() };

    try {
      await this.redisService.set(
        `${this.CACHE_PREFIX}${hash}`,
        JSON.stringify(cachedData),
        this.CACHE_TTL,
      );
    } catch (error) {
      this.logger.warn(`Failed to write to Redis (SET): ${error.message}`);
    }
  }

  async trackQuery(query: string, companyId: string): Promise<void> {
    const hash = this.generateHash(query, companyId);
    const statsKey = `${this.STATS_PREFIX}${hash}`;

    try {
      const currentCount = await this.redisService.incr(statsKey);

      if (currentCount) {
        await this.redisService.zadd(
          `${this.POPULAR_KEY}:${companyId}`,
          currentCount,
          JSON.stringify({ query: query.trim().toLowerCase(), companyId }),
        );
      }
    } catch (error) {
      this.logger.error('Error tracking query:', error);
    }
  }

  async getPopularQuestions(
    companyId: string,
    limit: number = 10,
  ): Promise<PopularQuestion[]> {
    try {
      const results = await this.redisService.zrevrange(
        `${this.POPULAR_KEY}:${companyId}`,
        0,
        limit - 1,
      );
      const popularQuestions: PopularQuestion[] = [];

      for (let i = 0; i < results.length; i += 2) {
        const data = JSON.parse(results[i]);
        popularQuestions.push({
          query: data.query,
          companyId: data.companyId,
          count: parseInt(results[i + 1]),
        });
      }
      return popularQuestions;
    } catch (error) {
      this.logger.error('Error getting popular questions:', error);
      return [];
    }
  }
}
