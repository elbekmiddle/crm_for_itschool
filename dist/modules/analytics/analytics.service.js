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
let AnalyticsService = class AnalyticsService {
    constructor(dbService, redisService, aiService) {
        this.dbService = dbService;
        this.redisService = redisService;
        this.aiService = aiService;
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
        const studentCheck = await this.dbService.query(`SELECT * FROM students WHERE id = $1 AND deleted_at IS NULL`, [studentId]);
        if (!studentCheck.length)
            return { error: 'Student not found' };
        const student = studentCheck[0];
        const presence = await this.dbService.query(`SELECT status, COUNT(*) as count FROM attendance WHERE student_id = $1 GROUP BY status`, [studentId]);
        const attendanceHistory = await this.dbService.query(`SELECT a.status, l.title as lesson_title, a.created_at 
       FROM attendance a 
       JOIN lessons l ON a.lesson_id = l.id 
       WHERE a.student_id = $1 
       ORDER BY a.created_at DESC`, [studentId]);
        const payments = await this.dbService.query(`SELECT amount, paid_at FROM payments WHERE student_id = $1 ORDER BY paid_at DESC`, [studentId]);
        const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const exams = await this.dbService.query(`SELECT e.title, er.score, er.submitted_at 
       FROM exam_results er 
       JOIN exams e ON er.exam_id = e.id 
       WHERE er.student_id = $1 
       ORDER BY er.submitted_at DESC`, [studentId]);
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
        const groups = await this.dbService.query(`SELECT * FROM groups WHERE teacher_id = $1`, [teacherId]);
        const groupIds = groups.map((g) => g.id);
        let students = [];
        let attendance = [];
        let debtors = [];
        let attendance_stats = [];
        let ai_humor = null;
        let most_active_student = null;
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
            attendance_stats = await this.dbService.query(`
        SELECT 
          s.id, s.first_name, s.last_name,
          COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as attended,
          COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) as missed
        FROM students s
        JOIN group_students gs ON s.id = gs.student_id
        LEFT JOIN attendance a ON a.student_id = s.id AND a.group_id = gs.group_id
        WHERE gs.group_id IN (${groupIdsStr}) AND s.deleted_at IS NULL
        GROUP BY s.id
      `);
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
            attendance_stats,
            most_active_student: most_active_student ? { ...most_active_student, badge: '😎' } : null,
            ai_humor,
            exams
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService,
        redis_service_1.RedisService,
        ai_service_1.AiService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map