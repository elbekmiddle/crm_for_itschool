import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DbService } from '../../infrastructure/database/db.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { StudentLoginDto } from './dto/student-login.dto';
import { get_user_by_email } from './queries/get_user_by_email';
import { get_user_by_id_for_auth } from './queries/get_user_by_id_for_auth';
import { get_student_by_phone } from './queries/get_student_by_phone';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly dbService: DbService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async logout(token: string) {
    try {
      const decoded = this.jwtService.decode(token) as any;
      if (!decoded || !decoded.exp) return { success: true };

      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redisService.set(`blacklist:${token}`, '1', { ex: ttl });
      }
      return { success: true };
    } catch (e) {
      return { success: true }; // Silent fail for invalid tokens
    }
  }

  async login(loginDto: LoginDto) {
    const users = await get_user_by_email(this.dbService, loginDto.email);

    if (!users.length) {
      throw new NotFoundException('User not found');
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async studentLogin(studentLoginDto: StudentLoginDto) {
    const students = await get_student_by_phone(this.dbService, studentLoginDto.phone);

    if (!students.length) {
      throw new NotFoundException('Student not found with this phone number');
    }

    const student = students[0];
    
    // Simple verification checking if first name matches
    if (student.first_name.toLowerCase() !== studentLoginDto.first_name.toLowerCase()) {
      throw new UnauthorizedException('Invalid first name for this phone number');
    }

    // Role will be set to 'STUDENT'
    return this.generateTokens({ ...student, role: 'STUDENT' });
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const users = await get_user_by_id_for_auth(this.dbService, payload.sub);

      if (!users.length) throw new Error();

      return this.generateTokens(users[0]);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(user: any) {
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
}
