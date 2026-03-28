import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../infrastructure/redis/redis.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private redisService;
    constructor(configService: ConfigService, redisService: RedisService);
    validate(req: any, payload: any): Promise<{
        id: any;
        email: any;
        role: any;
    }>;
}
export {};
