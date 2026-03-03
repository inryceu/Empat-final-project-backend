import { Module } from '@nestjs/common';
import { CacheService } from '../cache/services/cache.service';
import { RedisService } from '../cache/services/redis.service';

@Module({
  providers: [CacheService, RedisService],
  exports: [CacheService],
})
export class CacheModule {}