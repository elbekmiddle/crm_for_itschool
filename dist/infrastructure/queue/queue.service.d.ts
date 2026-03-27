import { OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
export declare class QueueService implements OnModuleInit {
    private configService;
    private readonly logger;
    aiQueue?: Queue;
    private worker?;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    addAiJob(data: any): Promise<import("bullmq").Job<any, any, string> | {
        success: boolean;
        message: string;
    }>;
}
