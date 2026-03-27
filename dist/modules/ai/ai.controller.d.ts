import { AiService } from './ai.service';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    analyzeStudent(body: any): Promise<{
        analysis: string;
    }>;
    groupSummary(body: any): Promise<{
        summary: string;
    }>;
}
