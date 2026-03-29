import { Module, forwardRef } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { QueueModule } from '../../infrastructure/queue/queue.module';

@Module({
  imports: [forwardRef(() => QueueModule)],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
