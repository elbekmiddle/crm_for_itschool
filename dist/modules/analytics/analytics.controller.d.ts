import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboard(): Promise<any>;
    getStudentAnalytics(id: string): Promise<{
        error: string;
        personal_info?: undefined;
        attendance_summary?: undefined;
        attendance_history?: undefined;
        payments?: undefined;
        total_paid?: undefined;
        exam_results?: undefined;
        ai_humor?: undefined;
    } | {
        personal_info: any;
        attendance_summary: any[];
        attendance_history: any[];
        payments: any[];
        total_paid: any;
        exam_results: any[];
        ai_humor: any;
        error?: undefined;
    }>;
    getTeacherDashboard(req: any): Promise<{
        total_groups: number;
        groups: any[];
        total_students: number;
        students: any[];
        debtors_count: number;
        debtors: any[];
        today_attendance: any[];
        attendance_stats: any[];
        most_active_student: any;
        ai_humor: any;
        exams: any[];
    }>;
    getMonthlyReport(year: number, month: number): Promise<{
        message: string;
        jobId: string;
        stats: {
            month: number;
            year: number;
            total_revenue: number;
            new_students: number;
            attendance_summary: any[];
        };
    }>;
    getJobStatus(id: string): Promise<{
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
