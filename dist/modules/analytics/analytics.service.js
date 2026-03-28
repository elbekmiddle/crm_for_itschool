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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../../infrastructure/database/db.service");
const redis_service_1 = require("../../infrastructure/redis/redis.service");
const ai_service_1 = require("../ai/ai.service");
const queue_service_1 = require("../../infrastructure/queue/queue.service");
const dashboard_stats_1 = require("./queries/dashboard_stats");
const student_analytics_data_1 = require("./queries/student_analytics_data");
const teacher_dashboard_data_1 = require("./queries/teacher_dashboard_data");
const monthly_report_data_1 = require("./queries/monthly_report_data");
let AnalyticsService = class AnalyticsService {
    constructor(dbService, redisService, aiService, queueService) {
        this.dbService = dbService;
        this.redisService = redisService;
        this.aiService = aiService;
        this.queueService = queueService;
    }
    async getDashboard() {
        const cacheKey = 'analytics:dashboard';
        const cached = await this.redisService.get(cacheKey);
        if (cached)
            return typeof cached === 'string' ? JSON.parse(cached) : cached;
        const data = await (0, dashboard_stats_1.dashboard_stats)(this.dbService);
        await this.redisService.set(cacheKey, data, { ex: 60 });
        return data;
    }
    async getStudentAnalytics(studentId) {
        const data = await (0, student_analytics_data_1.student_analytics_data)(this.dbService, studentId);
        if (!data)
            return { error: 'Student not found' };
        const { student, presence, attendanceHistory, payments, exams } = data;
        const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        let ai_humor = null;
        const missedObj = presence.find(p => p.status === 'ABSENT');
        const missedCount = missedObj ? parseInt(missedObj.count, 10) : 0;
        const presentObj = presence.find(p => p.status === 'PRESENT');
        const presentCount = presentObj ? parseInt(presentObj.count, 10) : 0;
        if (missedCount > 2) {
            const aiResponse = await this.aiService.analyzeStudent({
                name: `${student.first_name} ${student.last_name}`,
                missed_classes: missedCount,
                total_attended: presentCount
            });
            ai_humor = aiResponse.analysis;
        }
        if (student.first_name?.includes('Web') || student.last_name?.includes('Dasturlash')) {
            const demoAi = await this.aiService.analyzeStudent({
                name: "Web Dasturlash O'qituvchisi",
                special_mode: "DEMO",
                topic: "Full-Stack Development"
            });
            ai_humor = `${ai_humor ? ai_humor + '\n\n' : ''}🚀 DEMO: ${demoAi.analysis}`;
        }
        return {
            personal_info: student,
            attendance_summary: presence,
            attendance_history: attendanceHistory,
            payments: payments,
            total_paid: totalPaid,
            exam_results: exams,
            ai_humor
        };
    }
    async getTeacherDashboard(teacherId) {
        const data = await (0, teacher_dashboard_data_1.teacher_dashboard_data)(this.dbService, teacherId);
        const { groups, students, attendance, debtors, attendance_stats, exams } = data;
        let ai_humor = null;
        let most_active_student = null;
        if (attendance_stats.length > 0) {
            let maxAttended = -1;
            let maxMissed = -1;
            let mostAbsentStudent = null;
            for (const stat of attendance_stats) {
                const attended = parseInt(stat.attended, 10);
                const missed = parseInt(stat.missed, 10);
                if (attended >= maxAttended && attended > 0) {
                    maxAttended = attended;
                    most_active_student = stat;
                }
                if (missed > maxMissed && missed > 0) {
                    maxMissed = missed;
                    mostAbsentStudent = stat;
                }
            }
            if (mostAbsentStudent) {
                const aiResponse = await this.aiService.analyzeStudent({
                    name: `${mostAbsentStudent.first_name} ${mostAbsentStudent.last_name}`,
                    missed_classes: maxMissed,
                    total_attended: mostAbsentStudent.attended
                });
                ai_humor = {
                    student_id: mostAbsentStudent.id,
                    joke: aiResponse.analysis
                };
            }
        }
        return {
            total_groups: groups.length,
            groups,
            total_students: students.length,
            students,
            debtors_count: debtors.length,
            debtors,
            today_attendance: attendance,
            attendance_stats,
            most_active_student: most_active_student ? { ...most_active_student, badge: '😎' } : null,
            ai_humor,
            exams
        };
    }
    async getMonthlyAiReport(month, year) {
        const data = await (0, monthly_report_data_1.monthly_report_data)(this.dbService, month, year);
        const job = await this.queueService.addFinancialJob(data);
        return {
            message: 'Monthly AI analysis has been queued.',
            jobId: job?.id,
            stats: data
        };
    }
    async getAiJobStatus(jobId) {
        return this.queueService.getJobResult(jobId);
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService,
        redis_service_1.RedisService,
        ai_service_1.AiService,
        queue_service_1.QueueService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map