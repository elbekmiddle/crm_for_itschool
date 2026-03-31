import { Controller, Post, Get, Body, HttpCode, HttpStatus, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { StudentLoginDto } from './dto/student-login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { CheckPhoneDto } from './dto/check-phone.dto';
import { CheckCodeDto } from './dto/check-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { StudentPasswordLoginDto } from './dto/student-password-login.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /* ── ADMIN / TEACHER / MANAGER ── */

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user (admin/manager/teacher) with email+password' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /* ── STUDENT LEGACY (phone + firstName) ── */

  @Post('student-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Student login with phone + firstName (legacy)' })
  studentLogin(@Body() studentLoginDto: StudentLoginDto) {
    return this.authService.studentLogin(studentLoginDto);
  }

  /* ── STUDENT TELEGRAM VERIFICATION FLOW ── */

  /**
   * Step 1: Check phone number
   * Returns: { exists, is_verified, has_telegram, first_name }
   */
  @Post('check-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 1: Check if student phone exists and is verified' })
  checkPhone(@Body() dto: CheckPhoneDto) {
    return this.authService.checkPhone(dto);
  }

  /**
   * Step 2a: Send verification code via Telegram bot
   */
  @Post('send-verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 2a: Send 6-digit code via Telegram bot (5min TTL)' })
  sendVerifyCode(@Body() dto: CheckPhoneDto) {
    return this.authService.sendVerifyCode(dto);
  }

  /**
   * Step 1.5: Pre-validate code without setting password (for UX: show error before asking for new password)
   */
  @Post('check-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 1.5: Pre-validate Telegram code (no password change)' })
  checkCode(@Body() dto: CheckCodeDto) {
    return this.authService.checkCode(dto);
  }

  /**
   * Step 2b: Verify code + set password → returns JWT
   */
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 2b: Verify Telegram code, set password, receive JWT' })
  verifyCode(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCodeAndSetPassword(dto);
  }

  /**
   * Step 2c: Already verified — login with phone + password
   */
  @Post('student-login-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 2c: Login verified student with phone + password' })
  studentPasswordLogin(@Body() dto: StudentPasswordLoginDto) {
    return this.authService.studentPasswordLogin(dto);
  }

  /* ── TOKEN REFRESH / LOGOUT ── */

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshDto.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  logout(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.authService.logout(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@Request() req) {
    return req.user;
  }
}
