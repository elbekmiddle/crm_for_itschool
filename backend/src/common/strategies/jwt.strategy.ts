import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { normalizeRole, permissionsForRole } from '../constants/role-permissions';
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
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Prioritize Header (localStorage)
        cookieExtractor, // Fallback for HttpOnly cookie usage
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
      try {
        const blacklisted = await this.redisService.get(`blacklist:${token}`);
        if (blacklisted) {
          throw new UnauthorizedException('Token qora ro\'yxatda');
        }
      } catch (e: any) {
        if (e instanceof UnauthorizedException) throw e;
        // Redis tarmoq xatosi — kirishni bloklamaslik
      }
    }
    
    const role = normalizeRole(payload.role);
    /** Token ichidagi `permissions` (login paytida yozilgan) + rol bo‘yicha server ro‘yxati — eski/yarim tokenlarda 403 bo‘lmasin. */
    const fromJwt = Array.isArray(payload.permissions)
      ? payload.permissions.filter((x: unknown): x is string => typeof x === 'string')
      : [];
    const serverPerms = permissionsForRole(role);
    const permissions = Array.from(new Set([...serverPerms, ...fromJwt]));

    return {
      id: payload.sub,
      email: payload.email,
      role: role || payload.role,
      permissions,
      first_name: payload.first_name,
      last_name: payload.last_name,
      phone: payload.phone,
    };
  }
}

