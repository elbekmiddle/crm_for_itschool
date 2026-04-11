import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AiService } from '../../modules/ai/ai.service';
import { DbService } from '../database/db.service';
import { process_exam_questions } from './commands/process_exam_questions';

@Injectable()
export class QueueService implements OnModuleInit {
  private readonly logger = new Logger(QueueService.name);
  public aiQueue?: Queue;
  private worker?: Worker;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => AiService)) private aiService: AiService,
    private dbService: DbService
  ) {

    const url = this.configService.get<string>('REDIS_URL');
    if (!url) {
      this.logger.warn('REDIS_URL missing from .env, Queue service is disabled.');
      return;
    }
    const connection = new Redis(url, { maxRetriesPerRequest: null });

    this.aiQueue = new Queue('ai-processing', { connection });

    this.worker = new Worker(
      'ai-processing',
      async (job) => {
        this.logger.log(`Processing AI job ${job.id} type: ${job.name}`);
        
        try {
          let result;
          switch (job.name) {
            case 'analyze-financials':
              result = await this.aiService.analyzeFinancials(job.data);
              break;
            case 'analyze-student':
              result = await this.aiService.analyzeStudent(job.data);
              break;
            case 'generate-exam':
              const { examId, lessonId, topic, level, count, teacherId } = job.data;
              const questions = await this.aiService.generateExamQuestions(topic, level, count);
              result = await process_exam_questions(this.dbService, examId, lessonId, teacherId, level, questions);
              break;
            default:
              this.logger.warn(`Unknown job type: ${job.name}`);
              return { success: false, error: 'Unknown job type' };
          }
          return { success: true, result };
        } catch (error: any) {
          this.logger.error(`Failed to process job ${job.id}: ${error.message}`);
          throw error;
        }
      },
      { connection }
    );


    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed with error: ${err.message}`);
    });
  }

  onModuleInit() {
    this.logger.log('BullMQ QueueService initialized. Ready for background tasks.');
  }

  async addFinancialJob(data: any) {
    if (!this.aiQueue) return null;
    return this.aiQueue.add('analyze-financials', data, {
      removeOnComplete: true,
      removeOnFail: false
    });
  }

  async addExamJob(data: any) {
    if (!this.aiQueue) {
      this.logger.warn('Redis offline: Processing AI exam job synchronously...');
      const { examId, lessonId, topic, level, count, teacherId } = data;
      const questions = await this.aiService.generateExamQuestions(topic, level, count);
      await process_exam_questions(this.dbService, examId, lessonId, teacherId, level, questions);
      return { id: 'sync-' + Date.now(), getState: () => 'completed' };
    }
    return this.aiQueue.add('generate-exam', data, {
      removeOnComplete: true,
      removeOnFail: false
    });
  }


  async getJobResult(jobId: string) {
    if (!this.aiQueue) return null;
    const job = await this.aiQueue.getJob(jobId);
    if (!job) return { status: 'NOT_FOUND' };
    
    const state = await job.getState();
    return {
      id: job.id,
      state: state.toUpperCase(),
      progress: job.progress,
      result: job.returnvalue?.result || null,
      failedReason: job.failedReason
    };
  }
}

