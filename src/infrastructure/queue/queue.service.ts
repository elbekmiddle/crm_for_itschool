import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class QueueService implements OnModuleInit {
  private readonly logger = new Logger(QueueService.name);
  public aiQueue?: Queue;
  private worker?: Worker;

  constructor(private configService: ConfigService) {
    // BullMQ requires standard TCP Redis connection
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
        this.logger.log(`Processing AI job ${job.id} for payload: ${JSON.stringify(job.data)}`);
        // We'd delegate actual GPT requests here to avoid delaying HTTP requests
        return { success: true };
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

  async addAiJob(data: any) {
    if (!this.aiQueue) return { success: false, message: 'Queue is disabled' };
    return this.aiQueue.add('analyze', data);
  }
}
