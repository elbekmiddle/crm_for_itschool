import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { AiModule } from '../ai/ai.module';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [AiModule, GroupsModule],
  controllers: [ExamsController],
  providers: [ExamsService],
})
export class ExamsModule {}
