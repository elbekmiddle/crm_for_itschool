import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboard(): Promise<any>;
    getStudentAnalytics(id: string): Promise<{
        attendance_summary: any[];
        total_paid: any;
    }>;
}
