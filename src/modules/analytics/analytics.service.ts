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
}
