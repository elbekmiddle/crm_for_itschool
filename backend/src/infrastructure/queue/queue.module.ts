import { Global, Module, forwardRef } from '@nestjs/common';
import { QueueService } from './queue.service';
import { AiModule } from '../../modules/ai/ai.module';
import { DbModule } from '../database/db.module';

@Global()
@Module({
  imports: [forwardRef(() => AiModule), DbModule],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
