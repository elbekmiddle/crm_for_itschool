import { Injectable } from '@nestjs/common';
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
  constructor(
    private readonly dbService: DbService,
    private readonly redisService: RedisService,
    private readonly aiService: AiService,
    private readonly queueService: QueueService
  ) {}

  async getDashboard() {
    const cacheKey = 'analytics:dashboard';
    const cached = await this.redisService.get(cacheKey);
    if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;

    const data = await dashboard_stats(this.dbService);

    await this.redisService.set(cacheKey, data, { ex: 60 });
    return data;
  }

  async getStudentAnalytics(studentId: string) {
    const data = await student_analytics_data(this.dbService, studentId);
    if (!data) return { error: 'Student not found' };

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

    // Demo Logic for Web Dasturlash
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

  async getTeacherDashboard(teacherId: string) {
    const data = await teacher_dashboard_data(this.dbService, teacherId);
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
}

