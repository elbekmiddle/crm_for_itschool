import { Test, TestingModule } from '@nestjs/testing';
import { ExamsService } from './exams.service';
import { DbService } from '../../infrastructure/database/db.service';
import { NotFoundException } from '@nestjs/common';
import { QueueService } from '../../infrastructure/queue/queue.service';
import { TelegramService } from '../../infrastructure/notifications/telegram.service';
import { SocketsGateway } from '../sockets/sockets.gateway';
import { AiService } from '../ai/ai.service';
import { GroupsService } from '../groups/groups.service';

describe('ExamsService', () => {
  let service: ExamsService;
  let dbService: { query: jest.Mock };

  beforeEach(async () => {
    dbService = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        { provide: DbService, useValue: dbService },
        { provide: AiService, useValue: {} },
        { provide: QueueService, useValue: {} },
        { provide: TelegramService, useValue: {} },
        { provide: SocketsGateway, useValue: {} },
        { provide: GroupsService, useValue: {} },
      ],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
  });

  describe('startExamAttempt', () => {
    it('should throw NotFoundException when exam is not available for student', async () => {
      dbService.query.mockResolvedValueOnce([]);

      await expect(service.startExamAttempt('exam-id', 'student-id')).rejects.toThrow(NotFoundException);
    });
  });
});
