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

  /** Redis REST sozlanganmi (Upstash) */
  isEnabled(): boolean {
    return this.redis != null;
  }

  async get(key: string): Promise<any> {
    if (!this.redis) return null;
    return this.redis.get(key);
  }

  /**
   * Oddiy matn/raqam — JSON.stringify qilmasdan (verify kodlari uchun muhim).
   * Ob’ektlar — JSON.stringify.
   */
  async set(key: string, value: any, options?: { ex?: number }): Promise<void> {
    if (!this.redis) return;
    const payload =
      typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : JSON.stringify(value);
    if (options?.ex != null) {
      await this.redis.set(key, payload, { ex: options.ex });
    } else {
      await this.redis.set(key, payload);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redis) return;
    await this.redis.del(key);
  }
}
