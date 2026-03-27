import { ConfigService } from '@nestjs/config';
export declare class RedisService {
    private configService;
    private readonly redis;
    private readonly logger;
    constructor(configService: ConfigService);
    get(key: string): Promise<any>;
    set(key: string, value: any, options?: any): Promise<void>;
    del(key: string): Promise<void>;
}
