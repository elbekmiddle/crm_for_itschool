import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { AiService } from '../ai/ai.service';
import { QueueService } from '../../infrastructure/queue/queue.service';
import { dashboard_stats } from './queries/dashboard_stats';
import { student_analytics_data } from './queries/student_analytics_data';
import { teacher_dashboard_data } from './queries/teacher_dashboard_data';
import { monthly_report_data } from './queries/monthly_report_data';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly dbService: DbService,
    private readonly redisService: RedisService,
    private readonly aiService: AiService,
    private readonly queueService: QueueService
  ) {}

  async getDashboard() {
    const cacheKey = 'analytics:dashboard:v5';
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;
    } catch (e) {
      this.logger.warn(`Redis get failed for ${cacheKey}`, e);
    }

    const data = await dashboard_stats(this.dbService);

    let ai_insight: string | null = null;
    try {
      ai_insight = await this.aiService.summarizeDashboardSnapshot(data as Record<string, unknown>);
    } catch {
      ai_insight = null;
    }

    const payload = { ...data, ai_insight };
    try {
      await this.redisService.set(cacheKey, payload, { ex: 60 });
    } catch (e) {
      this.logger.warn('Redis cache set failed (dashboard still returned)', e);
    }
    return payload;
  }

  async getStudentAnalytics(studentId: string) {
    const cacheKey = `analytics:student:v2:${studentId}`;
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached != null && cached !== '') {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
        if (parsed && !parsed.error) return parsed;
      }
    } catch (e) {
      this.logger.warn(`Redis get ${cacheKey}`, e);
    }

    const data = await student_analytics_data(this.dbService, studentId);
    if (!data) return { error: 'Talaba topilmadi' };

    const { student, presence, attendanceHistory, payments, exams } = data;
    const totalPaid = payments.reduce(
      (sum, p) => sum + (parseFloat(String((p as any).amount ?? 0)) || 0),
      0,
    );

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

    // Demo Logic for Web Dasturlash
    if (student.first_name?.includes('Web') || student.last_name?.includes('Dasturlash')) {
      const demoAi = await this.aiService.analyzeStudent({
        name: "Web Dasturlash O'qituvchisi",
        special_mode: "DEMO",
        topic: "Full-Stack Development"
      });
      ai_humor = `${ai_humor ? ai_humor + '\n\n' : ''}🚀 DEMO: ${demoAi.analysis}`;
    }

    if (!ai_humor && this.aiService.isConfigured()) {
      try {
        ai_humor = await this.aiService.getStudentHumorStatus({
          name: `${student.first_name} ${student.last_name}`,
          present: presentCount,
          missed: missedCount,
        });
      } catch {
        ai_humor = null;
      }
    }

    const out = {
      personal_info: student,
      attendance_summary: presence,
      attendance_history: attendanceHistory,
      payments: payments,
      total_paid: totalPaid,
      exam_results: exams,
      ai_humor,
    };

    try {
      await this.redisService.set(cacheKey, out, { ex: 60 });
    } catch (e) {
      this.logger.warn(`Redis set ${cacheKey}`, e);
    }

    return out;
  }

  async getTeacherDashboard(teacherId: string) {
    const data = await teacher_dashboard_data(this.dbService, teacherId);
    const { groups, students, attendance, debtors, attendance_stats, exams, enrollmentTrend } = data;
    
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

    let totalSessions = 0;
    let totalAttended = 0;
    for (const stat of attendance_stats) {
      const att = parseInt(stat.attended, 10) || 0;
      const mis = parseInt(stat.missed, 10) || 0;
      totalAttended += att;
      totalSessions += att + mis;
    }
    const avgAttendance =
      totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0;

    const recentExams = (exams || []).slice(0, 8).map((e: any) => ({
      id: e.id,
      title: e.title,
      date: e.created_at,
      group_name: e.group_name?.trim() || null,
      course_name: e.course_name?.trim() || null,
      avg_score: Number(e.avg_score) || 0,
    }));

    const topStudents = [...attendance_stats]
      .map((s: any) => {
        const att = parseInt(s.attended, 10) || 0;
        const mis = parseInt(s.missed, 10) || 0;
        const tot = att + mis;
        const attendance_pct = tot > 0 ? Math.round((att / tot) * 100) : null;
        return { ...s, _ratio: tot > 0 ? att / tot : 0, attendance_pct };
      })
      .sort((a: any, b: any) => b._ratio - a._ratio)
      .slice(0, 5)
      .map(({ _ratio, ...rest }: any) => rest);

    return {
      total_groups: groups.length,
      totalGroups: groups.length,
      groups,
      total_students: students.length,
      totalStudents: students.length,
      avgAttendance,
      recentExams,
      topStudents,
      students,
      debtors_count: debtors.length,
      debtors,
      today_attendance: attendance,
      attendance_stats,
      most_active_student: most_active_student ? { ...most_active_student, badge: '😎' } : null,
      ai_humor,
      exams,
      enrollmentTrend: enrollmentTrend ?? { week: [], month: [], year: [] },
    };
  }

  async getMonthlyAiReport(month: number, year: number) {
    const data = await monthly_report_data(this.dbService, month, year);
    const job = await this.queueService.addFinancialJob(data);
    return {
      message: 'Monthly AI analysis has been queued.',
      jobId: job?.id,
      stats: data
    };
  }

  async getAiJobStatus(jobId: string) {
    return this.queueService.getJobResult(jobId);
  }

  async getStudentsForExport() {
    return this.dbService.query(
      `SELECT id, first_name, last_name, phone, created_at 
       FROM students 
       WHERE deleted_at IS NULL 
       ORDER BY created_at DESC`,
      []
    );
  }
}

