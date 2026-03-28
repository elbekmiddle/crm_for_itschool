import { ConfigService } from '@nestjs/config';
export declare class AiService {
    private configService;
    private openai;
    constructor(configService: ConfigService);
    analyzeStudent(data: any): Promise<{
        analysis: string;
    }>;
    groupSummary(data: any): Promise<{
        summary: string;
    }>;
    generateExamQuestions(topic: string, level: string, count: number): Promise<any[]>;
}
