import { Module, Global } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { DbModule } from '../database/db.module';

@Global()
@Module({
  imports: [DbModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
