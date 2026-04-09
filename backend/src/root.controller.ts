import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiExcludeController()
@Controller()
export class RootController {
  @SkipThrottle()
  @Get('health')
  health() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      env: process.env.NODE_ENV ?? 'development',
      ts: new Date().toISOString(),
    };
  }

  @Get('api/v1/docs')
  @Redirect('/api/v1/docs', 301)
  redirectToDocs() {}

  @Get('favicon.ico')
  handleFavicon() {
    return { message: 'ok' };
  }
}
