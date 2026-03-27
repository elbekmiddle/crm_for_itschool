"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const redis_1 = require("@upstash/redis");
const config_1 = require("@nestjs/config");
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.redis = null;
        this.logger = new common_1.Logger(RedisService_1.name);
        const url = this.configService.get('UPSTASH_REDIS_REST_URL');
        const token = this.configService.get('UPSTASH_REDIS_REST_TOKEN');
        if (url && token && token !== 'your_token') {
            this.redis = new redis_1.Redis({ url, token });
            this.logger.log('Upstash Redis connection initialized.');
        }
        else {
            this.logger.warn('Upstash Redis credentials missing; caching disabled.');
        }
    }
    async get(key) {
        if (!this.redis)
            return null;
        return this.redis.get(key);
    }
    async set(key, value, options) {
        if (!this.redis)
            return;
        if (options) {
            await this.redis.set(key, JSON.stringify(value), options);
        }
        else {
            await this.redis.set(key, JSON.stringify(value));
        }
    }
    async del(key) {
        if (!this.redis)
            return;
        await this.redis.del(key);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map