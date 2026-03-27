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
let AnalyticsService = class AnalyticsService {
    constructor(dbService, redisService) {
        this.dbService = dbService;
        this.redisService = redisService;
    }
    async getDashboard() {
        const cacheKey = 'analytics:dashboard';
        const cached = await this.redisService.get(cacheKey);
        if (cached)
            return typeof cached === 'string' ? JSON.parse(cached) : cached;
        const studentsCount = await this.dbService.query(`SELECT COUNT(*) FROM students WHERE deleted_at IS NULL`);
        const coursesCount = await this.dbService.query(`SELECT COUNT(*) FROM courses`);
        const totalRevenue = await this.dbService.query(`SELECT SUM(amount) as total FROM payments`);
        const data = {
            total_students: parseInt(studentsCount[0].count, 10),
            total_courses: parseInt(coursesCount[0].count, 10),
            total_revenue: totalRevenue[0].total || 0,
        };
        await this.redisService.set(cacheKey, data, { ex: 60 });
        return data;
    }
    async getStudentAnalytics(studentId) {
        const presence = await this.dbService.query(`SELECT status, COUNT(*) FROM attendance WHERE student_id = $1 GROUP BY status`, [studentId]);
        const payments = await this.dbService.query(`SELECT SUM(amount) as total FROM payments WHERE student_id = $1`, [studentId]);
        return {
            attendance_summary: presence,
            total_paid: payments[0].total || 0,
        };
    }
    async getTeacherDashboard(teacherId) {
        const groups = await this.dbService.query(`SELECT * FROM groups WHERE teacher_id = $1`, [teacherId]);
        const groupIds = groups.map((g) => g.id);
        let students = [];
        let attendance = [];
        let debtors = [];
        if (groupIds.length > 0) {
            const groupIdsStr = groupIds.map((id) => `'${id}'`).join(',');
            students = await this.dbService.query(`
        SELECT DISTINCT s.* FROM students s 
        JOIN group_students gs ON s.id = gs.student_id 
        WHERE gs.group_id IN (${groupIdsStr}) AND s.deleted_at IS NULL
      `);
            attendance = await this.dbService.query(`
        SELECT * FROM attendance 
        WHERE group_id IN (${groupIdsStr}) AND lesson_date = CURRENT_DATE
      `);
            debtors = await this.dbService.query(`
        SELECT DISTINCT s.* FROM students s
        JOIN group_students gs ON s.id = gs.student_id
        LEFT JOIN (
          SELECT student_id, MAX(paid_at) as last_payment 
          FROM payments GROUP BY student_id
        ) p ON p.student_id = s.id
        WHERE gs.group_id IN (${groupIdsStr}) 
        AND (p.last_payment IS NULL OR p.last_payment < NOW() - INTERVAL '60 days')
        AND s.deleted_at IS NULL
      `);
        }
        const exams = await this.dbService.query(`SELECT * FROM exams WHERE teacher_id = $1`, [teacherId]);
        return {
            total_groups: groups.length,
            groups,
            total_students: students.length,
            students,
            debtors_count: debtors.length,
            debtors,
            today_attendance: attendance,
            exams
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService,
        redis_service_1.RedisService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map