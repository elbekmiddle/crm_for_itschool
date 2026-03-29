import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { DbService } from '../../infrastructure/database/db.service';
import { AiService } from '../ai/ai.service';
import { BadRequestException } from '@nestjs/common';

describe('StudentsService (Logic Units)', () => {
  let service: StudentsService;
  let dbService: any;

  beforeEach(async () => {
    dbService = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: DbService, useValue: dbService },
        { provide: AiService, useValue: {} },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  describe('transferGroup', () => {
    it('should throw BadRequestException if groups belong to different courses', async () => {
      dbService.query.mockResolvedValue([
        { course_id: 'course-1' },
        { course_id: 'course-2' },
      ]);

      await expect(service.transferGroup('st-id', 'g1', 'g2'))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should execute transfer in transaction if same course', async () => {
      dbService.query.mockResolvedValueOnce([
        { course_id: 'course-1' },
        { course_id: 'course-1' },
      ]);
      
      dbService.query.mockResolvedValueOnce(null); // BEGIN
      dbService.query.mockResolvedValueOnce(null); // UPDATE
      dbService.query.mockResolvedValueOnce([{ id: 'new-reg' }]); // INSERT

      const result = await service.transferGroup('st-id', 'g1', 'g2');
      
      expect(dbService.query).toHaveBeenCalledWith('BEGIN');
      expect(dbService.query).toHaveBeenCalledWith('COMMIT');
      expect(result.id).toEqual('new-reg');
    });
  });

  describe('transferCourse', () => {
    it('should close old course and enroll in new one', async () => {
      dbService.query.mockResolvedValue(null); // BEGIN, UPDATES
      // we need to mock service.enroll too if it's called internally
      jest.spyOn(service, 'enroll').mockResolvedValue({ id: 'new-enroll' } as any);

      const result = await service.transferCourse('st-id', 'old-c', 'new-c');
      
      expect(dbService.query).toHaveBeenCalledWith('BEGIN');
      expect(dbService.query).toHaveBeenCalledWith('COMMIT');
      expect(result.success).toBe(true);
    });
  });
});
