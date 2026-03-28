import { DbService } from '../../infrastructure/database/db.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { AiService } from '../ai/ai.service';
export declare class AnalyticsService {
    private readonly dbService;
    private readonly redisService;
    private readonly aiService;
    constructor(dbService: DbService, redisService: RedisService, aiService: AiService);
    getDashboard(): Promise<any>;
    getStudentAnalytics(studentId: string): Promise<{
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
    getTeacherDashboard(teacherId: string): Promise<{
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
}
