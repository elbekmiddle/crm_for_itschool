import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { TelegramModule } from '../../infrastructure/notifications/telegram.module';
import { SocketsModule } from '../sockets/sockets.module';

@Module({
  imports: [TelegramModule, SocketsModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
