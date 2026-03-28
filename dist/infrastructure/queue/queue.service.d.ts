import { OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../../modules/ai/ai.service';
import { DbService } from '../database/db.service';
export declare class QueueService implements OnModuleInit {
    private configService;
    private aiService;
    private dbService;
    private readonly logger;
    aiQueue?: Queue;
    private worker?;
    constructor(configService: ConfigService, aiService: AiService, dbService: DbService);
    onModuleInit(): void;
    addFinancialJob(data: any): Promise<import("bullmq").Job<any, any, string>>;
    addExamJob(data: any): Promise<import("bullmq").Job<any, any, string>>;
    getJobResult(jobId: string): Promise<{
        status: string;
        id?: undefined;
        state?: undefined;
        progress?: undefined;
        result?: undefined;
        failedReason?: undefined;
    } | {
        id: string;
        state: string;
        progress: number | object;
        result: any;
        failedReason: string;
        status?: undefined;
    }>;
}
