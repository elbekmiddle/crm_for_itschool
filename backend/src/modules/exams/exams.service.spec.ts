import { Test, TestingModule } from '@nestjs/testing';
import { ExamsService } from './exams.service';
import { DbService } from '../../infrastructure/database/db.service';
import { ConflictException, BadRequestException } from '@nestjs/common';
import * as dayjs from 'dayjs';

describe('ExamsService (Auto-Submit Logic)', () => {
  let service: ExamsService;
  let dbService: any;

  beforeEach(async () => {
    dbService = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        { provide: DbService, useValue: dbService },
        { provide: 'AiService', useValue: {} },
        { provide: 'QueueService', useValue: {} },
      ],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
  });

  describe('startExam', () => {
    it('should auto-close if time limit exceeded', async () => {
      // 1. Mock active student
      dbService.query.mockResolvedValueOnce([{ status: 'active' }]);
      
      // 2. Mock expired session (started 2 hours ago, limit 60 min)
      const startTime = dayjs().subtract(2, 'hours').toDate();
      dbService.query.mockResolvedValueOnce([{
        started_at: startTime,
        time_limit: 60,
        finished_at: null
      }]);

      await expect(service.startExam('exam-id', 'st-id'))
        .rejects
        .toThrow(ConflictException);

      // Verify update called to close
      expect(dbService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE exam_results SET finished_at'),
        expect.anything()
      );
    });

    it('should throw BadRequestException for blocked students', async () => {
      // 1. Mock blocked student
      dbService.query.mockResolvedValueOnce([{ status: 'blocked' }]);

      await expect(service.startExam('exam-id', 'st-id'))
        .rejects
        .toThrow(BadRequestException);
    });
  });
});
