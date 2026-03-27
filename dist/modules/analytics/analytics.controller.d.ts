import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboard(): Promise<any>;
    getStudentAnalytics(id: string): Promise<{
        attendance_summary: any[];
        total_paid: any;
    }>;
    getTeacherDashboard(req: any): Promise<{
        total_groups: number;
        groups: any[];
        total_students: number;
        students: any[];
        debtors_count: number;
        debtors: any[];
        today_attendance: any[];
        exams: any[];
    }>;
}
