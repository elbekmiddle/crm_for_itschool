import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class RootController {
  @Get('api/docs')
  @Redirect('/api/v1/docs', 301)
  redirectToDocs() {}

  @Get('favicon.ico')
  handleFavicon() {
    return { message: 'ok' };
  }
}
