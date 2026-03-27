import { DbService } from '../../infrastructure/database/db.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
export declare class AnalyticsService {
    private readonly dbService;
    private readonly redisService;
    constructor(dbService: DbService, redisService: RedisService);
    getDashboard(): Promise<any>;
    getStudentAnalytics(studentId: string): Promise<{
        attendance_summary: any[];
        total_paid: any;
    }>;
    getTeacherDashboard(teacherId: string): Promise<{
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
