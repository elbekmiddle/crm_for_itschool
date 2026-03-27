import { Injectable, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private readonly redis: Redis | null = null;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('UPSTASH_REDIS_REST_URL');
    const token = this.configService.get<string>('UPSTASH_REDIS_REST_TOKEN');

    if (url && token && token !== 'your_token') {
      this.redis = new Redis({ url, token });
      this.logger.log('Upstash Redis connection initialized.');
    } else {
      this.logger.warn('Upstash Redis credentials missing; caching disabled.');
    }
  }

  async get(key: string): Promise<any> {
    if (!this.redis) return null;
    return this.redis.get(key);
  }

  async set(key: string, value: any, options?: any): Promise<void> {
    if (!this.redis) return;
    if (options) {
      await this.redis.set(key, JSON.stringify(value), options);
    } else {
      await this.redis.set(key, JSON.stringify(value));
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redis) return;
    await this.redis.del(key);
  }
}
