import { Module, Global } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramReceptionBot } from './telegram-reception.service';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from '../database/db.module';

@Global()
@Module({
  imports: [ConfigModule, DbModule],
  providers: [TelegramService, TelegramReceptionBot],
  exports: [TelegramService],
})
export class TelegramModule {}
