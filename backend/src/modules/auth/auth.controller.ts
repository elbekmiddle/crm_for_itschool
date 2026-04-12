import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
  Res,
  Req,
  UnauthorizedException,
  BadRequestException,
  GoneException,
} from '@nestjs/common';
import { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { StudentLoginDto } from './dto/student-login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { CheckPhoneDto } from './dto/check-phone.dto';
import { CheckCodeDto } from './dto/check-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { StudentPasswordLoginDto } from './dto/student-password-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ConfirmForgotPasswordDto } from './dto/confirm-forgot-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';

/** JWT `expiresIn` qatori (masalan `15m`, `7d`) → cookie maxAge ms */
function jwtExpiresToCookieMs(expr: unknown, fallbackMs: number): number {
  if (typeof expr !== 'string' || !expr.trim()) return fallbackMs;
  const m = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(expr.trim());
  if (!m) return fallbackMs;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 0) return fallbackMs;
  const u = m[2].toLowerCase();
  const mult =
    u === 'ms' ? 1 : u === 's' ? 1000 : u === 'm' ? 60_000 : u === 'h' ? 3_600_000 : u === 'd' ? 86_400_000 : 0;
  if (!mult) return fallbackMs;
  return n * mult;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /* ── ADMIN / TEACHER / MANAGER ── */

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Foydalanuvchi kirishi (admin/manager/teacher) email+parol bilan' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    this.setCookies(res, { access_token: result.access_token, refresh_token: result.refresh_token });
    return {
      message: 'Muvaffaqiyatli tizimga kirdingiz',
      user: result.user,
    };
  }

  /* ── STUDENT LEGACY — o‘chirilgan (parolsiz kirish xavfli) ── */

  @Post('student-login')
  @ApiOperation({ summary: 'DEPRECATED — 410 Gone', description: 'Telefon + parol: POST /auth/student-login-password' })
  studentLogin(@Body() _dto: StudentLoginDto) {
    throw new GoneException(
      "Bu endpoint o'chirilgan. POST /auth/student-login-password (telefon + parol) yoki Telegram tasdiqlash oqimidan foydalaning.",
    );
  }

  /* ── STUDENT TELEGRAM VERIFICATION FLOW ── */

  /**
   * Step 1: Check phone number
   * Returns: { exists, is_verified, has_telegram, first_name }
   */
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('check-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '1-qadam: Telefon raqam mavjudligini tekshirish' })
  checkPhone(@Body() dto: CheckPhoneDto) {
    return this.authService.checkPhone(dto);
  }

  /**
   * Step 2a: Send verification code via Telegram bot
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('send-verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '2a-qadam: Telegram orqali 6 raqamli kod yuborish (5 daqiqa)' })
  sendVerifyCode(@Body() dto: CheckPhoneDto) {
    return this.authService.sendVerifyCode(dto);
  }

  /**
   * Step 1.5: Pre-validate code without setting password (for UX: show error before asking for new password)
   */
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @Post('check-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '1.5-qadam: Telegram kodini tekshirish (parolsiz)' })
  checkCode(@Body() dto: CheckCodeDto) {
    return this.authService.checkCode(dto);
  }

  /**
   * Step 2b: Verify code + set password → returns JWT
   */
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '2b-qadam: Telegram kodini tasdiqlash, parol o\'rnatish va tizimga kirish' })
  async verifyCode(@Body() dto: VerifyCodeDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyCodeAndSetPassword(dto);
    this.setCookies(res, { access_token: result.access_token, refresh_token: result.refresh_token });
    return {
      message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz va tizimga kirdingiz',
      user: result.user,
    };
  }

  /**
   * Step 2c: Already verified — login with phone + password
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('student-login-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '2c-qadam: Tasdiqlangan o\'quvchini telefon + parol bilan kirish' })
  async studentPasswordLogin(@Body() dto: StudentPasswordLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.studentPasswordLogin(dto);
    this.setCookies(res, { access_token: result.access_token, refresh_token: result.refresh_token });
    return {
      message: 'Muvaffaqiyatli tizimga kirdingiz',
      user: result.user,
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('staff-phone-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xodim: telefon + parol (o‘qituvchi / menejer / admin)' })
  async staffPhoneLogin(@Body() dto: StudentPasswordLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.staffPhoneLogin(dto);
    this.setCookies(res, { access_token: result.access_token, refresh_token: result.refresh_token });
    return {
      message: 'Muvaffaqiyatli tizimga kirdingiz',
      user: result.user,
    };
  }

  /* ── TOKEN REFRESH / LOGOUT ── */

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Access tokenni yangilash' })
  async refresh(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token || req.headers['x-refresh-token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token topilmadi');
    }
    const tokens = await this.authService.refreshToken(refreshToken as string);
    this.setCookies(res, tokens);
    return { message: 'Token muvaffaqiyatli yangilandi' };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tizimdan chiqish' })
  async logout(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
    const access = req.cookies?.access_token;
    const refresh = req.cookies?.refresh_token;
    if (access || refresh) {
      await this.authService.logout(access, refresh);
    }
    this.clearCookies(res);
    return { message: 'Tizimdan muvaffaqiyatli chiqdingiz' };
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parolni tiklash (Telegram orqali)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.recoverPassword(dto.email);
  }

  @Post('forgot-password/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tasdiqlash kodi + yangi parol (Telegram kodidan keyin)' })
  async confirmForgotPassword(@Body() dto: ConfirmForgotPasswordDto) {
    return this.authService.confirmForgotPassword(dto.email, dto.code, dto.new_password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Joriy foydalanuvchi ma\'lumotlarini olish' })
  async getMe(@Request() req) {
    return this.authService.getProfileForRequest(req.user);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Joriy parol bilan yangi parolni o‘rnatish (staff)' })
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    if (req.user?.role === 'STUDENT') {
      throw new BadRequestException('Talaba parolini boshqa endpoint orqali yangilang');
    }
    return this.authService.changeStaffPassword(req.user.id, dto.current_password, dto.new_password);
  }

  /* ── HELPER: Set HTTPOnly Secure Cookies ── */
  private setCookies(res: Response, tokens: { access_token: string; refresh_token: string }) {
    const isProduction = process.env.NODE_ENV === 'production';
    const accessMs = jwtExpiresToCookieMs(this.configService.get('JWT_EXPIRES_IN'), 15 * 60 * 1000);
    const refreshMs = jwtExpiresToCookieMs(this.configService.get('JWT_REFRESH_EXPIRES_IN'), 7 * 24 * 60 * 60 * 1000);

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: accessMs,
      path: '/',
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: refreshMs,
      path: '/',
    });
  }

  private clearCookies(res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
  }
}
