import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signup(dto);
    this.setSessionCookie(res, result.accessToken);
    this.setRefreshTokenCookie(res, result.refreshToken);

    return result;
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setSessionCookie(res, result.accessToken);
    this.setRefreshTokenCookie(res, result.refreshToken);

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.id);
    res.clearCookie('session', this.cookieOptions());
    res.clearCookie('refreshToken', {
      ...this.cookieOptions(),
      path: '/api/auth/refresh',
    });
    return { success: true };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @CurrentUser() user: { id: string; refreshToken: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refreshTokens(
      user.id,
      user.refreshToken,
    );
    this.setSessionCookie(res, result.accessToken);
    this.setRefreshTokenCookie(res, result.refreshToken);

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  @HttpCode(200)
  resendVerification(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.resendVerification(user.id);
  }

  @Post('verify-email')
  @HttpCode(200)
  verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Get('verify-email')
  verifyEmailQuery(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  private setSessionCookie(res: Response, accessToken: string) {
    res.cookie('session', accessToken, {
      ...this.cookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      ...this.cookieOptions(),
      path: '/api/auth/refresh',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
    });
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };
  }
}
