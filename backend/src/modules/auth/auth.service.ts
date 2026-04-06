import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
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
import { get_student_by_id_with_auth_data } from './queries/get_student_by_id_with_auth_data';

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

  async logout(token: string) {
    try {
      const decoded = this.jwtService.decode(token) as any;
      if (!decoded || !decoded.exp) return { success: true };
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redisService.set(`blacklist:${token}`, '1', { ex: ttl });
      }
      return { success: true };
    } catch {
      return { success: true };
    }
  }

  async login(loginDto: LoginDto) {
    this.logger.debug(`[login] email: ${loginDto.email}`);
    const users = await this.dbService.query(
      'SELECT id, email, password, role, first_name, last_name, phone, telegram_chat_id FROM users WHERE email = $1',
      [loginDto.email]
    );
    
    if (!users.length) {
      this.logger.warn(`[login] User not found: ${loginDto.email}`);
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    
    const user = users[0];
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password).catch(() => false);
    if (!isPasswordValid) {
      this.logger.warn(`[login] Invalid password for: ${loginDto.email}`);
      throw new UnauthorizedException('Email yoki parol noto\'g\'ri');
    }
    
    // Update last login
    await this.dbService.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

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
    if (!students.length) throw new NotFoundException('Student not found with this phone number');
    const student = students[0];
    if (student.first_name.toLowerCase() !== studentLoginDto.first_name.toLowerCase()) {
      throw new UnauthorizedException('Invalid first name for this phone number');
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
    this.logger.debug(`[checkPhone] normalized: ${dto.phone} → ${phone}`);
    const students = await get_student_by_phone(this.dbService, phone);
    if (!students.length) {
      throw new NotFoundException(`Bu telefon raqam (${phone}) tizimda yo'q. Admin bilan bog'laning.`);
    }
    const student = students[0];
    return {
      exists: true,
      is_verified: !!student.is_verified,
      has_telegram: !!student.telegram_chat_id,
      first_name: student.first_name,
    };
  }

  /**
   * Step 2a: Send verification code via Telegram (if student has telegram_chat_id)
   * Generates 6-digit code, stores in Redis with 5min TTL, sends via bot
   */
  async sendVerifyCode(dto: CheckPhoneDto) {
    const phone = this.normalizePhone(dto.phone);
    const students = await get_student_by_phone(this.dbService, phone);
    if (!students.length) throw new NotFoundException('Student not found');

    const student = students[0];

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const redisKey = `verify:${phone}`;

    // Store in Redis for 5 minutes
    await this.redisService.set(redisKey, code, { ex: 300 });
    this.logger.debug(`[sendVerifyCode] phone=${phone} code=${code} redis_key=${redisKey}`);

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
  async checkCode(dto: CheckCodeDto) {
    const phone = this.normalizePhone(dto.phone);
    const redisKey = `verify:${phone}`;
    const storedCode = await this.redisService.get(redisKey);
    this.logger.debug(`[checkCode] phone=${phone} entered=${dto.code} stored=${storedCode}`);
    if (!storedCode) {
      throw new BadRequestException('Kod muddati tugagan. Qaytadan so\'rang.');
    }
    if (storedCode !== dto.code) {
      throw new BadRequestException('Noto\'g\'ri kod. Telegram dan kodni yana bir bor tekshiring.');
    }
    return { valid: true, message: 'Kod to\'g\'ri!' };
  }

  /**
   * Step 2b: Verify code + set new password + return JWT
   */
  async verifyCodeAndSetPassword(dto: VerifyCodeDto) {
    const phone = this.normalizePhone(dto.phone);
    const redisKey = `verify:${phone}`;
    const storedCode = await this.redisService.get(redisKey);
    this.logger.debug(`[verifyCode] phone=${phone} entered=${dto.code} stored=${storedCode}`);
    if (!storedCode) {
      throw new BadRequestException('Kod muddati tugagan. Qaytadan so\'rang.');
    }
    if (storedCode !== dto.code) {
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
    await this.redisService.del(redisKey);
    const students = await get_student_by_phone(this.dbService, phone);
    if (!students.length) throw new NotFoundException('Student not found');

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
    await this.dbService.query('UPDATE students SET last_login_at = NOW() WHERE id = $1', [student.id]);

    const tokens = await this.generateTokens({ ...student, role: 'STUDENT' });
    return { ...tokens, user: { id: student.id, phone: student.phone, role: 'STUDENT', first_name: student.first_name, last_name: student.last_name } };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      
      this.logger.debug(`[refreshToken] sub: ${payload.sub} role: ${payload.role}`);
      
      let user;
      if (payload.role === 'STUDENT') {
        const studentRes = await get_student_by_id_with_auth_data(this.dbService, payload.sub);
        if (!studentRes.length) throw new Error('Student not found');
        user = { ...studentRes[0], role: 'STUDENT' };
      } else {
        const userRes = await get_user_by_id_for_auth(this.dbService, payload.sub);
        if (!userRes.length) throw new Error('User not found');
        user = userRes[0];
      }
      
      return this.generateTokens(user);
    } catch (error) {
      this.logger.warn(`[refreshToken] failed: ${error.message}`);
      throw new UnauthorizedException('JWT muddati tugagan yoki noto\'g\'ri');
    }
  }

  private async generateTokens(user: any) {
    const rolePermissions = {
      'ADMIN': ['*'],
      'MANAGER': ['STUDENT_READ', 'STUDENT_CREATE', 'STUDENT_UPDATE', 'STUDENT_ENROLL', 'COURSE_READ', 'GROUP_READ', 'GROUP_CREATE', 'GROUP_UPDATE', 'PAYMENT_READ', 'PAYMENT_CREATE', 'ANALYTICS_VIEW'],
      'TEACHER': ['STUDENT_READ', 'STUDENT_CREATE', 'STUDENT_UPDATE', 'GROUP_READ', 'GROUP_CREATE', 'GROUP_UPDATE', 'ATTENDANCE_MARK', 'ATTENDANCE_READ', 'EXAM_MANAGE', 'PAYMENT_READ', 'ANALYTICS_VIEW'],
      'STUDENT': ['STUDENT_READ', 'EXAM_PASS', 'EXAM_READ', 'ATTENDANCE_READ', 'PAYMENT_READ', 'COURSE_READ']
    };

    const payload = {
      sub: user.id,
      role: user.role,
      permissions: rolePermissions[user.role] || [],
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      email: user.email || '',
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async recoverPassword(email: string) {
    const users = await this.dbService.query(
      'SELECT id, email, first_name, phone, telegram_chat_id FROM users WHERE email = $1',
      [email]
    );
    if (!users.length) throw new NotFoundException('Foydalanuvchi topilmadi');
    const user = users[0];

    const tempCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    if (user.telegram_chat_id) {
       await this.telegramService.sendPasswordRecovery(user.telegram_chat_id, user.first_name || 'Xodim', tempCode);
       const hashed = await bcrypt.hash(tempCode, 10);
       await this.dbService.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id]);
       return { success: true, message: 'Telegram botga vaqtinchalik parol yuborildi!' };
    } else {
       await this.telegramService.notifyAdminOfPasswordRequest(user);
       return { success: true, message: 'Telegram bot ulanmagan. Administratorga xabar yuborildi!' };
    }
  }
}
