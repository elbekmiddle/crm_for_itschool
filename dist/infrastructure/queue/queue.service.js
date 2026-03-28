"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var QueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
const ai_service_1 = require("../../modules/ai/ai.service");
const db_service_1 = require("../database/db.service");
const process_exam_questions_1 = require("./commands/process_exam_questions");
let QueueService = QueueService_1 = class QueueService {
    constructor(configService, aiService, dbService) {
        this.configService = configService;
        this.aiService = aiService;
        this.dbService = dbService;
        this.logger = new common_1.Logger(QueueService_1.name);
        const url = this.configService.get('REDIS_URL');
        if (!url) {
            this.logger.warn('REDIS_URL missing from .env, Queue service is disabled.');
            return;
        }
        const connection = new ioredis_1.default(url, { maxRetriesPerRequest: null });
        this.aiQueue = new bullmq_1.Queue('ai-processing', { connection });
        this.worker = new bullmq_1.Worker('ai-processing', async (job) => {
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
                        result = await (0, process_exam_questions_1.process_exam_questions)(this.dbService, examId, lessonId, teacherId, level, questions);
                        break;
                    default:
                        this.logger.warn(`Unknown job type: ${job.name}`);
                        return { success: false, error: 'Unknown job type' };
                }
                return { success: true, result };
            }
            catch (error) {
                this.logger.error(`Failed to process job ${job.id}: ${error.message}`);
                throw error;
            }
        }, { connection });
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
    async addFinancialJob(data) {
        if (!this.aiQueue)
            return null;
        return this.aiQueue.add('analyze-financials', data, {
            removeOnComplete: true,
            removeOnFail: false
        });
    }
    async addExamJob(data) {
        if (!this.aiQueue)
            return null;
        return this.aiQueue.add('generate-exam', data, {
            removeOnComplete: true,
            removeOnFail: false
        });
    }
    async getJobResult(jobId) {
        if (!this.aiQueue)
            return null;
        const job = await this.aiQueue.getJob(jobId);
        if (!job)
            return { status: 'NOT_FOUND' };
        const state = await job.getState();
        return {
            id: job.id,
            state: state.toUpperCase(),
            progress: job.progress,
            result: job.returnvalue?.result || null,
            failedReason: job.failedReason
        };
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = QueueService_1 = __decorate([
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => ai_service_1.AiService))),
    __metadata("design:paramtypes", [config_1.ConfigService,
        ai_service_1.AiService,
        db_service_1.DbService])
], QueueService);
//# sourceMappingURL=queue.service.js.map