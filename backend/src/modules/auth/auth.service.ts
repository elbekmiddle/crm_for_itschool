import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DbService } from '../../infrastructure/database/db.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { TelegramService } from '../../infrastructure/notifications/telegram.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { StudentLoginDto } from './dto/student-login.dto';
import { CheckPhoneDto } from './dto/check-phone.dto';
import { CheckCodeDto } from './dto/check-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { StudentPasswordLoginDto } from './dto/student-password-login.dto';
import { get_user_by_email } from './queries/get_user_by_email';
import { get_user_by_id_for_auth } from './queries/get_user_by_id_for_auth';
import { get_student_by_phone } from './queries/get_student_by_phone';
import { get_staff_by_phone } from './queries/get_staff_by_phone';
import { get_student_by_id_with_auth_data } from './queries/get_student_by_id_with_auth_data';
import { normalizeRole, permissionsForRole } from '../../common/constants/role-permissions';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly dbService: DbService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly telegramService: TelegramService,
  ) {}

  /** Normalize phone: strip non-digits, ensure + prefix */
  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    // Remove leading 0 if UZ format (0901234567 → 998901234567)
    const normalized = digits.startsWith('0') ? `998${digits.slice(1)}` : digits;
    return `+${normalized}`;
  }

  /** GET /auth/me — always fresh from DB (names, phone, photo). */
  async getProfileForRequest(reqUser: { id: string; role: string }) {
    if (!reqUser?.id) {
      throw new UnauthorizedException('Sessiya topilmadi');
    }
    if (reqUser.role === 'STUDENT') {
      const rows = await get_student_by_id_with_auth_data(this.dbService, reqUser.id);
      if (!rows.length) {
        throw new UnauthorizedException('Foydalanuvchi topilmadi');
      }
      const s = rows[0] as any;
      return {
        id: s.id,
        role: 'STUDENT' as const,
        first_name: s.first_name,
        last_name: s.last_name,
        phone: s.phone,
        email: s.email ?? null,
        parent_name: s.parent_name,
      };
    }
    const rows = await get_user_by_id_for_auth(this.dbService, reqUser.id);
    if (!rows.length) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }
    return rows[0];
  }

  private async blacklistToken(token: string | undefined) {
    if (!token) return;
    if (!this.redisService.isEnabled()) {
      throw new ServiceUnavailableException(
        'Sessiyani bekor qilish uchun Redis (UPSTASH_REDIS_*) sozlangan bo‘lishi kerak.',
      );
    }
    try {
      const decoded = this.jwtService.decode(token) as { exp?: number } | null;
      if (!decoded?.exp) return;
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redisService.set(`blacklist:${token}`, '1', { ex: ttl });
      }
    } catch (e: any) {
      if (e instanceof ServiceUnavailableException) throw e;
      throw new ServiceUnavailableException('Sessiyani bekor qilishda xatolik. Redisni tekshiring.');
    }
  }

  async logout(accessToken?: string, refreshToken?: string) {
    await this.blacklistToken(accessToken);
    await this.blacklistToken(refreshToken);
    return { success: true };
  }

  async login(loginDto: LoginDto) {
    this.logger.debug('[login] attempt');
    const users = await this.dbService.query(
      'SELECT id, email, password, role, first_name, last_name FROM users WHERE email = $1',
      [loginDto.email]
    );
    
    if (!users.length) {
      this.logger.warn('[login] user not found');
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    
    const user = users[0];
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password).catch(() => false);
    if (!isPasswordValid) {
      this.logger.warn('[login] invalid password');
      throw new UnauthorizedException('Email yoki parol noto\'g\'ri');
    }
    
    // Backward compatibility: older schemas may not have last_login_at yet.
    try {
      await this.dbService.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    } catch (error) {
      this.logger.warn(`[login] Skipping last_login_at update: ${error.message}`);
    }

    try {
      const tokens = await this.generateTokens(user);
      return { 
        ...tokens, 
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role, 
          first_name: user.first_name, 
          last_name: user.last_name,
          phone: user.phone,
          telegram_chat_id: user.telegram_chat_id
        } 
      };
    } catch (error) {
      this.logger.error(`[login] Token generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ----- STUDENT LOGIN (legacy phone+firstName) -----
  async studentLogin(studentLoginDto: StudentLoginDto) {
    const students = await get_student_by_phone(this.dbService, studentLoginDto.phone);
    if (!students.length) throw new NotFoundException('Bu telefon raqam bilan talaba topilmadi.');
    const student = students[0];
    if (student.first_name.toLowerCase() !== studentLoginDto.first_name.toLowerCase()) {
      throw new UnauthorizedException('Ism bu telefon raqamga mos kelmaydi.');
    }
    const tokens = await this.generateTokens({ ...student, role: 'STUDENT' });
    return { ...tokens, user: { id: student.id, phone: student.phone, role: 'STUDENT', first_name: student.first_name, last_name: student.last_name } };
  }

  // ----- TELEGRAM VERIFICATION FLOW -----

  /**
   * Step 1: Check if student phone exists and is_verified status
   */
  async checkPhone(dto: CheckPhoneDto) {
    const phone = this.normalizePhone(dto.phone);
    this.logger.debug('[checkPhone] ok');
    const students = await get_student_by_phone(this.dbService, phone);
    if (students.length) {
      const student = students[0];
      return {
        exists: true,
        login_kind: 'student' as const,
        is_verified: !!student.is_verified,
        has_telegram: !!student.telegram_chat_id,
      };
    }
    const staffRows = await get_staff_by_phone(this.dbService, phone);
    if (staffRows.length) {
      const u = staffRows[0] as any;
      return {
        exists: true,
        login_kind: 'staff' as const,
        role: u.role,
        is_verified: true,
        has_telegram: !!u.telegram_chat_id,
        message: 'Xodim akkaunti topildi',
      };
    }
    return {
      exists: false,
      login_kind: null,
      is_verified: false,
      has_telegram: false,
      message: 'Bu telefon raqam tizimda topilmadi. Admin bilan bog‘laning.',
    };
  }

  /**
   * Step 2a: Send verification code via Telegram (if student has telegram_chat_id)
   * Generates 6-digit code, stores in Redis with 5min TTL, sends via bot
   */
  async sendVerifyCode(dto: CheckPhoneDto) {
    if (!this.redisService.isEnabled()) {
      throw new ServiceUnavailableException(
        'Tasdiqlash kodi uchun Redis (UPSTASH_REDIS_REST_URL) sozlanmagan.',
      );
    }
    const phone = this.normalizePhone(dto.phone);
    const students = await get_student_by_phone(this.dbService, phone);
    if (!students.length) throw new NotFoundException('Talaba topilmadi — telefon raqamni tekshiring.');

    const student = students[0];

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const redisKey = `verify:${phone}`;

    await this.redisService.set(redisKey, code, { ex: 300 });
    this.logger.debug('[sendVerifyCode] code dispatched');

    if (student.telegram_chat_id) {
      await this.telegramService.sendVerifyCode(student.telegram_chat_id, code, student.first_name, student.id);
    } else {
      await this.telegramService.sendVerifyCodeToAdmin(student.first_name, phone, code, student.id);
    }

    return {
      success: true,
      message: student.telegram_chat_id
        ? 'Kod Telegram ga yuborildi'
        : 'Kod administrator ga yuborildi (telegram ulanmagan)',
    };
  }

  /**
   * Step 2: Pre-validate the code without setting password
   * Returns 200 if code matches, 400 if wrong/expired
   */
  private async readVerifyCode(phone: string): Promise<string | null> {
    if (!this.redisService.isEnabled()) return null;
    const redisKey = `verify:${phone}`;
    const raw = await this.redisService.get(redisKey);
    if (raw == null || raw === '') return null;
    return String(raw).replace(/\D/g, '');
  }

  private async clearVerifyCode(phone: string) {
    if (!this.redisService.isEnabled()) return;
    await this.redisService.del(`verify:${phone}`);
    await this.redisService.del(`verify_attempts:${phone}`);
  }

  async checkCode(dto: CheckCodeDto) {
    if (!this.redisService.isEnabled()) {
      throw new ServiceUnavailableException('Kod tekshiruvi uchun Redis talab qilinadi.');
    }
    const phone = this.normalizePhone(dto.phone);
    const attKey = `verify_attempts:${phone}`;
    const prev = parseInt(String((await this.redisService.get(attKey)) ?? '0'), 10) || 0;
    if (prev >= 5) {
      throw new HttpException('Juda ko‘p urinish. 5 daqiqadan keyin qayta urining.', HttpStatus.TOO_MANY_REQUESTS);
    }
    const entered = String(dto.code || '').replace(/\D/g, '');
    const storedNorm = await this.readVerifyCode(phone);
    this.logger.debug('[checkCode] validation');
    if (!storedNorm) {
      throw new BadRequestException('Kod muddati tugagan. Qaytadan so\'rang.');
    }
    if (storedNorm !== entered) {
      await this.redisService.set(attKey, String(prev + 1), { ex: 300 });
      throw new BadRequestException('Noto\'g\'ri kod. Telegram dan kodni yana bir bor tekshiring.');
    }
    await this.redisService.del(attKey);
    return { valid: true, message: 'Kod to\'g\'ri!' };
  }

  /**
   * Step 2b: Verify code + set new password + return JWT
   */
  async verifyCodeAndSetPassword(dto: VerifyCodeDto) {
    if (!this.redisService.isEnabled()) {
      throw new ServiceUnavailableException('Tasdiqlash uchun Redis talab qilinadi.');
    }
    const phone = this.normalizePhone(dto.phone);
    const entered = String(dto.code || '').replace(/\D/g, '');
    const storedNorm = await this.readVerifyCode(phone);
    this.logger.debug('[verifyCode] step');
    if (!storedNorm) {
      throw new BadRequestException('Kod muddati tugagan. Qaytadan so\'rang.');
    }
    if (storedNorm !== entered) {
      throw new BadRequestException('Noto\'g\'ri kod.');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Update student: set is_verified=true, save password
    await this.dbService.query(
      `UPDATE students SET is_verified = true, password = $1
       WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = REGEXP_REPLACE($2::text, '[^0-9]', '', 'g') AND deleted_at IS NULL`,
      [hashedPassword, phone],
    );
    await this.clearVerifyCode(phone);
    const students = await get_student_by_phone(this.dbService, phone);
    if (!students.length) throw new NotFoundException('Talaba topilmadi.');

    const student = students[0];

    // Send welcome Telegram notification
    if (student.telegram_chat_id) {
      await this.telegramService.sendWelcome(student.telegram_chat_id, student.first_name, student.id);
    }

    const tokens = await this.generateTokens({ ...student, role: 'STUDENT' });
    return { ...tokens, user: { id: student.id, phone: student.phone, role: 'STUDENT', first_name: student.first_name, last_name: student.last_name } };
  }

  /**
   * Step 2c: Login verified student with phone + password
   */
  async studentPasswordLogin(dto: StudentPasswordLoginDto) {
    const phone = this.normalizePhone(dto.phone);
    const students = await get_student_by_phone(this.dbService, phone);
    if (!students.length) {
      throw new NotFoundException('Bu telefon raqam tizimda yo\'q.');
    }

    const student = students[0];

    if (!student.password) {
      throw new UnauthorizedException('Parol o\'rnatilmagan. Telegram orqali tasdiqlang.');
    }

    const isValid = await bcrypt.compare(dto.password, student.password);
    if (!isValid) {
      throw new UnauthorizedException('Parol noto\'g\'ri.');
    }

    // Update student last login
    try {
      await this.dbService.query('UPDATE students SET last_login_at = NOW() WHERE id = $1', [student.id]);
    } catch {
      /* ustun bo‘lmasa */
    }

    const tokens = await this.generateTokens({ ...student, role: 'STUDENT' });
    return { ...tokens, user: { id: student.id, phone: student.phone, role: 'STUDENT', first_name: student.first_name, last_name: student.last_name } };
  }

  /** O‘qituvchi / menejer / admin — telefon + parol (users jadvali) */
  async staffPhoneLogin(dto: StudentPasswordLoginDto) {
    const phone = this.normalizePhone(dto.phone);
    const rows = await get_staff_by_phone(this.dbService, phone);
    if (!rows.length) {
      throw new NotFoundException('Bu telefon raqam xodimlar ro‘yxatida yo‘q.');
    }
    const user = rows[0] as any;
    if (!user.password) {
      throw new UnauthorizedException('Parol o‘rnatilmagan — administrator bilan bog‘laning.');
    }
    const ok = await bcrypt.compare(dto.password, user.password).catch(() => false);
    if (!ok) {
      throw new UnauthorizedException('Telefon yoki parol noto‘g‘ri.');
    }
    try {
      await this.dbService.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    } catch {
      /* */
    }
    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        telegram_chat_id: user.telegram_chat_id,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      if (!this.redisService.isEnabled()) {
        throw new UnauthorizedException('Token yangilash uchun Redis talab qilinadi.');
      }
      let bl: string | null | undefined;
      try {
        bl = await this.redisService.get(`blacklist:${refreshToken}`);
      } catch {
        throw new UnauthorizedException('Autentifikatsiya xizmati vaqtincha ishlamayapti');
      }
      if (bl != null && bl !== '') {
        throw new UnauthorizedException('Sessiya bekor qilingan');
      }
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      this.logger.debug('[refreshToken] ok');
      
      let user;
      if (payload.role === 'STUDENT') {
        const studentRes = await get_student_by_id_with_auth_data(this.dbService, payload.sub);
        if (!studentRes.length) throw new UnauthorizedException('Talaba topilmadi');
        user = { ...studentRes[0], role: 'STUDENT' };
      } else {
        const userRes = await get_user_by_id_for_auth(this.dbService, payload.sub);
        if (!userRes.length) throw new UnauthorizedException('Foydalanuvchi topilmadi');
        user = userRes[0];
      }
      
      return this.generateTokens(user);
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.warn(`[refreshToken] failed: ${error?.message || error}`);
      throw new UnauthorizedException('JWT muddati tugagan yoki noto\'g\'ri');
    }
  }

  private async generateTokens(user: any) {
    let resolvedRole = normalizeRole(user.role);
    if (!resolvedRole && user.role != null && String(user.role).trim()) {
      resolvedRole = normalizeRole(String(user.role));
    }
    const payload = {
      sub: user.id,
      role: resolvedRole || user.role,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async recoverPassword(email: string) {
    const generic = {
      success: true,
      message: "Agar bu email tizimda bo'lsa, xabar yuborilgan.",
    };
    const users = await this.dbService.query(
      'SELECT id, email, first_name, telegram_chat_id FROM users WHERE email = $1',
      [email],
    );
    if (!users.length) return generic;
    const user = users[0] as { id: string; telegram_chat_id?: string | null; first_name?: string };

    if (!this.redisService.isEnabled()) {
      throw new ServiceUnavailableException('Parol tiklash uchun Redis talab qilinadi.');
    }

    const tempCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(tempCode, 10);
    await this.redisService.set(`pwrecover:${user.id}`, codeHash, { ex: 900 });

    if (user.telegram_chat_id) {
      await this.telegramService.sendPasswordRecovery(
        user.telegram_chat_id,
        user.first_name || 'Xodim',
        tempCode,
      );
      return generic;
    }
    await this.telegramService.notifyAdminOfPasswordRequest(user);
    return generic;
  }

  async confirmForgotPassword(email: string, code: string, newPassword: string) {
    if (!this.redisService.isEnabled()) {
      throw new ServiceUnavailableException('Parol tasdiqlash uchun Redis talab qilinadi.');
    }
    const users = await this.dbService.query(
      'SELECT id, email, first_name FROM users WHERE email = $1',
      [email],
    );
    if (!users.length) throw new NotFoundException('Foydalanuvchi topilmadi');
    const user = users[0] as { id: string };

    let stored: string | null = null;
    try {
      const r = await this.redisService.get(`pwrecover:${user.id}`);
      if (typeof r === 'string') stored = r;
    } catch {
      /* */
    }
    if (!stored) {
      throw new BadRequestException('Tasdiqlash kodi topilmadi yoki muddati tugagan. Qaytadan so‘rang.');
    }
    const ok = await bcrypt.compare(String(code).trim(), stored);
    if (!ok) {
      throw new BadRequestException('Kod noto‘g‘ri');
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.dbService.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id]);
    try {
      await this.redisService.del(`pwrecover:${user.id}`);
    } catch {
      /* */
    }
    return { success: true, message: 'Parol yangilandi' };
  }

  /** Joriy parolni tekshirib, yangi parolni saqlash (faqat `users` jadvali — admin/manager/teacher). */
  async changeStaffPassword(userId: string, currentPassword: string, newPassword: string) {
    const rows = await this.dbService.query(
      `SELECT id, password FROM users WHERE id = $1`,
      [userId],
    );
    if (!rows?.length) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    const row = rows[0] as { password?: string };
    if (!row.password) {
      throw new BadRequestException('Parol hali o‘rnatilmagan — administrator bilan bog‘laning');
    }
    const ok = await bcrypt.compare(currentPassword, row.password).catch(() => false);
    if (!ok) {
      throw new UnauthorizedException('Joriy parol noto‘g‘ri');
    }
    if (newPassword.length < 6) {
      throw new BadRequestException('Yangi parol kamida 6 belgi bo‘lishi kerak');
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.dbService.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashed, userId]);
    return { success: true, message: 'Parol yangilandi' };
  }
}
