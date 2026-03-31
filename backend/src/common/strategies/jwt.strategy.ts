import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { Request } from 'express';

const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['access_token'];
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private redisService: RedisService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Fallback uchun
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'super_secret_jwt_key_here',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    // Cookie'dan yoki header'dan token olish
    const token = req.cookies?.access_token || req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const blacklisted = await this.redisService.get(`blacklist:${token}`);
      if (blacklisted) {
        throw new UnauthorizedException('Token qora ro\'yxatda');
      }
    }
    
    return { 
      id: payload.sub, 
      email: payload.email, 
      role: payload.role,
      first_name: payload.first_name,
      last_name: payload.last_name,
      phone: payload.phone
    };
  }
}

