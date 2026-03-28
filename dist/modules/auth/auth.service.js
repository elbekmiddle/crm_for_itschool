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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const db_service_1 = require("../../infrastructure/database/db.service");
const redis_service_1 = require("../../infrastructure/redis/redis.service");
const bcrypt = require("bcrypt");
const get_user_by_email_1 = require("./queries/get_user_by_email");
const get_user_by_id_for_auth_1 = require("./queries/get_user_by_id_for_auth");
let AuthService = class AuthService {
    constructor(jwtService, dbService, configService, redisService) {
        this.jwtService = jwtService;
        this.dbService = dbService;
        this.configService = configService;
        this.redisService = redisService;
    }
    async logout(token) {
        try {
            const decoded = this.jwtService.decode(token);
            if (!decoded || !decoded.exp)
                return { success: true };
            const ttl = decoded.exp - Math.floor(Date.now() / 1000);
            if (ttl > 0) {
                await this.redisService.set(`blacklist:${token}`, '1', { ex: ttl });
            }
            return { success: true };
        }
        catch (e) {
            return { success: true };
        }
    }
    async login(loginDto) {
        const users = await (0, get_user_by_email_1.get_user_by_email)(this.dbService, loginDto.email);
        if (!users.length) {
            throw new common_1.NotFoundException('User not found');
        }
        const user = users[0];
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return this.generateTokens(user);
    }
    async refreshToken(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            const users = await (0, get_user_by_id_for_auth_1.get_user_by_id_for_auth)(this.dbService, payload.sub);
            if (!users.length)
                throw new Error();
            return this.generateTokens(users[0]);
        }
        catch (e) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async generateTokens(user) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        });
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        db_service_1.DbService,
        config_1.ConfigService,
        redis_service_1.RedisService])
], AuthService);
//# sourceMappingURL=auth.service.js.map