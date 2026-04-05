import { Controller, Post, Get, Body, HttpCode, HttpStatus, Request, UseGuards, Res, Req, UnauthorizedException } from '@nestjs/common';
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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /* ── ADMIN / TEACHER / MANAGER ── */

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Foydalanuvchi kirishi (admin/manager/teacher) email+parol bilan' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    this.setCookies(res, { access_token: result.access_token, refresh_token: result.refresh_token });
    return { 
      message: 'Muvaffaqiyatli tizimga kirdingiz',
      user: result.user,
      access_token: result.access_token,
      refresh_token: result.refresh_token
    };
  }

  /* ── STUDENT LEGACY (phone + firstName) ── */

  @Post('student-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'O\'quvchi kirishi telefon + ism bilan (eski usul)' })
  async studentLogin(@Body() studentLoginDto: StudentLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.studentLogin(studentLoginDto);
    this.setCookies(res, { access_token: result.access_token, refresh_token: result.refresh_token });
    return { 
      message: 'Muvaffaqiyatli tizimga kirdingiz',
      user: result.user,
      access_token: result.access_token,
      refresh_token: result.refresh_token
    };
  }

  /* ── STUDENT TELEGRAM VERIFICATION FLOW ── */

  /**
   * Step 1: Check phone number
   * Returns: { exists, is_verified, has_telegram, first_name }
   */
  @Post('check-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '1-qadam: Telefon raqam mavjudligini tekshirish' })
  checkPhone(@Body() dto: CheckPhoneDto) {
    return this.authService.checkPhone(dto);
  }

  /**
   * Step 2a: Send verification code via Telegram bot
   */
  @Post('send-verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '2a-qadam: Telegram orqali 6 raqamli kod yuborish (5 daqiqa)' })
  sendVerifyCode(@Body() dto: CheckPhoneDto) {
    return this.authService.sendVerifyCode(dto);
  }

  /**
   * Step 1.5: Pre-validate code without setting password (for UX: show error before asking for new password)
   */
  @Post('check-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '1.5-qadam: Telegram kodini tekshirish (parolsiz)' })
  checkCode(@Body() dto: CheckCodeDto) {
    return this.authService.checkCode(dto);
  }

  /**
   * Step 2b: Verify code + set password → returns JWT
   */
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '2b-qadam: Telegram kodini tasdiqlash, parol o\'rnatish va tizimga kirish' })
  async verifyCode(@Body() dto: VerifyCodeDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyCodeAndSetPassword(dto);
    this.setCookies(res, { access_token: result.access_token, refresh_token: result.refresh_token });
    return { 
      message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz va tizimga kirdingiz',
      user: result.user,
      access_token: result.access_token,
      refresh_token: result.refresh_token
    };
  }

  /**
   * Step 2c: Already verified — login with phone + password
   */
  @Post('student-login-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '2c-qadam: Tasdiqlangan o\'quvchini telefon + parol bilan kirish' })
  async studentPasswordLogin(@Body() dto: StudentPasswordLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.studentPasswordLogin(dto);
    this.setCookies(res, { access_token: result.access_token, refresh_token: result.refresh_token });
    return { 
      message: 'Muvaffaqiyatli tizimga kirdingiz',
      user: result.user,
      access_token: result.access_token,
      refresh_token: result.refresh_token
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
    return { 
      message: 'Token muvaffaqiyatli yangilandi',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tizimdan chiqish' })
  async logout(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.access_token;
    if (token) {
      await this.authService.logout(token);
    }
    this.clearCookies(res);
    return { message: 'Tizimdan muvaffaqiyatli chiqdingiz' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parolni tiklash (Telegram orqali)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.recoverPassword(dto.email);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Joriy foydalanuvchi ma\'lumotlarini olish' })
  getMe(@Request() req) {
    return req.user;
  }

  /* ── HELPER: Set HTTPOnly Secure Cookies ── */
  private setCookies(res: Response, tokens: { access_token: string; refresh_token: string }) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Access token - 30 kun (to match JWT_EXPIRES_IN)
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });

    // Refresh token - 60 kun (to match JWT_REFRESH_EXPIRES_IN)
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60 * 1000, // 60 days
      path: '/',
    });
  }

  private clearCookies(res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
  }
}
