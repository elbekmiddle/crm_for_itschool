import { Injectable } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly dbService: DbService,
    private readonly redisService: RedisService
  ) {}

  async getDashboard() {
    const cacheKey = 'analytics:dashboard';
    const cached = await this.redisService.get(cacheKey);
    if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;

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

  async getStudentAnalytics(studentId: string) {
    const presence = await this.dbService.query(
      `SELECT status, COUNT(*) FROM attendance WHERE student_id = $1 GROUP BY status`,
      [studentId]
    );
    const payments = await this.dbService.query(
      `SELECT SUM(amount) as total FROM payments WHERE student_id = $1`,
      [studentId]
    );

    return {
      attendance_summary: presence,
      total_paid: payments[0].total || 0,
    };
  }

  async getTeacherDashboard(teacherId: string) {
    const groups = await this.dbService.query(`SELECT * FROM groups WHERE teacher_id = $1`, [teacherId]);
    const groupIds = groups.map((g: any) => g.id);
    
    let students = [];
    let attendance = [];
    let debtors = [];
    
    if (groupIds.length > 0) {
      const groupIdsStr = groupIds.map((id: string) => `'${id}'`).join(',');
      
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
}
