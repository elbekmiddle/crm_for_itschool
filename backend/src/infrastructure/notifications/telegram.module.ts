import { Module, Global, forwardRef } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramReceptionBot } from './telegram-reception.service';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from '../database/db.module';
import { SocketsModule } from '../../modules/sockets/sockets.module';

@Global()
@Module({
  imports: [ConfigModule, DbModule, forwardRef(() => SocketsModule)],
  providers: [TelegramService, TelegramReceptionBot],
  exports: [TelegramService],
})
export class TelegramModule {}
