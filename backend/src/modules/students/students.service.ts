import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { all_students } from './queries/all_students';
import { get_student } from './queries/get_student';
import { create_student } from './commands/create_student';
import { update_student } from './commands/update_student';
import { delete_student } from './commands/delete_student';

import { enroll_student } from './commands/enroll_student';
import { get_student_dashboard } from './queries/get_student_dashboard';
import { AiService } from '../ai/ai.service';
import { SocketsGateway } from '../sockets/sockets.gateway';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly dbService: DbService,
    private readonly aiService: AiService,
    private readonly socketsGateway: SocketsGateway,
    private readonly redisService: RedisService,
  ) {}

  async create(createStudentDto: CreateStudentDto, createdBy: string) {
    const row = await create_student(this.dbService, createStudentDto, createdBy);
    this.socketsGateway.emitDashboardRefresh({ source: 'student', action: 'created' });
    return row;
  }

  async findAll(page: number = 1, limit: number = 20, user?: any, compact?: boolean) {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Math.min(Math.max(1, Math.floor(limit) || 20), 500);
    return all_students(this.dbService, safePage, safeLimit, user, Boolean(compact));
  }

  async findOne(id: string) {
    return get_student(this.dbService, id);
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    const row = await update_student(this.dbService, id, updateStudentDto);
    this.socketsGateway.emitDashboardRefresh({ source: 'student', action: 'updated' });
    return row;
  }

  async remove(id: string) {
    const row = await delete_student(this.dbService, id);
    this.socketsGateway.emitDashboardRefresh({ source: 'student', action: 'deleted' });
    return row;
  }

  async enroll(
    id: string,
    courseId: string,
    actor?: { id: string; role: string },
  ) {
    if (actor?.role === 'TEACHER' && courseId) {
      let ok: any[];
      try {
        ok = await this.dbService.query(
          `SELECT 1 FROM courses WHERE id = $1::uuid AND teacher_id = $2::uuid AND deleted_at IS NULL LIMIT 1`,
          [courseId, actor.id],
        );
      } catch (e: any) {
        if (e?.code === '42703') {
          ok = await this.dbService.query(
            `SELECT 1 FROM courses WHERE id = $1::uuid AND teacher_id = $2::uuid LIMIT 1`,
            [courseId, actor.id],
          );
        } else {
          throw e;
        }
      }
      if (!ok?.length) {
        throw new ForbiddenException("Faqat o'z kurslaringizga talaba yozishingiz mumkin");
      }
    }
    const row = await enroll_student(this.dbService, id, courseId);
    this.socketsGateway.emitDashboardRefresh({ source: 'student', action: 'enrolled' });
    return row;
  }

  async getDashboard(id: string) {
    const data = await get_student_dashboard(this.dbService, id);
    if (!data) return null;

    void this.aiService
      .getStudentHumorStatus({
        present_days: data.present_days,
        absent_days: data.absent_days,
        last_payment: data.payments[0]?.paid_at,
        name: data.first_name,
      })
      .then((humor) => {
        this.socketsGateway.emitToRoom(`user:${id}`, 'dashboard_ai_status', { humor });
      })
      .catch(() => {});

    return { ...data, ai_status: null };
  }

  async transferCourse(id: string, oldCourseId: string, newCourseId: string) {
    const client = await this.dbService.getClient();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE student_courses SET status = 'transferred', ended_at = NOW() 
         WHERE student_id = $1 AND course_id = $2 AND status = 'active'`,
        [id, oldCourseId],
      );
      await client.query(
        `UPDATE group_students SET left_at = NOW() 
         WHERE student_id = $1 AND group_id IN (SELECT id FROM groups WHERE course_id = $2)`,
        [id, oldCourseId],
      );
      const { enrollment } = await enroll_student(this.dbService, id, newCourseId, client);
      await client.query('COMMIT');
      this.socketsGateway.emitDashboardRefresh({ source: 'student', action: 'transfer_course' });
      return { success: true, enrollment };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async transferGroup(id: string, oldGroupId: string, newGroupId: string) {
    // Rule: must be same course
    const courses = await this.dbService.query(
      `SELECT course_id FROM groups WHERE id IN ($1, $2)`,
      [oldGroupId, newGroupId]
    );

    if (courses.length < 2 || courses[0].course_id !== courses[1].course_id) {
       throw new BadRequestException('Group transfer must be within the same course.');
    }

    const client = await this.dbService.getClient();
    try {
      await client.query('BEGIN');
      const inOld = await client.query(
        `SELECT 1 FROM group_students WHERE student_id = $1 AND group_id = $2 AND left_at IS NULL LIMIT 1`,
        [id, oldGroupId],
      );
      if (!inOld.rows.length) {
        await client.query('ROLLBACK');
        throw new BadRequestException('Talaba ushbu guruhda (faol) emas.');
      }
      await client.query(
        `UPDATE group_students SET left_at = NOW() WHERE student_id = $1 AND group_id = $2`,
        [id, oldGroupId],
      );
      const result = await client.query(
        `INSERT INTO group_students (student_id, group_id) VALUES ($1, $2) RETURNING *`,
        [id, newGroupId],
      );
      await client.query('COMMIT');
      this.socketsGateway.emitDashboardRefresh({ source: 'student', action: 'transfer_group' });
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findSimilar(firstName: string, lastName: string) {
    const firstNameSnippet = firstName.substring(0, 3);
    const lastNameSnippet = lastName.substring(0, 3);
    return this.dbService.query(
      `SELECT id, first_name, last_name, phone, status 
       FROM students 
       WHERE (first_name ILIKE $1 OR last_name ILIKE $2) 
         AND deleted_at IS NULL 
       LIMIT 5`,
      [`%${firstNameSnippet}%`, `%${lastNameSnippet}%`]
    );
  }

  async getAttendance(studentId: string) {
    const cacheKey = `attendance:student:v1:${studentId}`;
    if (this.redisService.isEnabled()) {
      try {
        const raw = await this.redisService.get(cacheKey);
        if (raw != null && raw !== '') {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (parsed?.records) return parsed;
        }
      } catch (e) {
        this.logger.debug(`Attendance cache read skipped: ${(e as Error)?.message}`);
      }
    }

    const sqlFull = `SELECT 
         a.id,
         a.student_id,
         a.status,
         a.notes,
         a.lesson_date,
         a.created_at,
         g.name AS group_name,
         c.name AS course_name
       FROM attendance a
       LEFT JOIN groups g ON a.group_id = g.id
       LEFT JOIN courses c ON g.course_id = c.id
       WHERE a.student_id = $1
       ORDER BY a.lesson_date DESC NULLS LAST, a.created_at DESC`;

    const sqlNoNotes = `SELECT 
         a.id,
         a.student_id,
         a.status,
         a.lesson_date,
         a.created_at,
         g.name AS group_name,
         c.name AS course_name
       FROM attendance a
       LEFT JOIN groups g ON a.group_id = g.id
       LEFT JOIN courses c ON g.course_id = c.id
       WHERE a.student_id = $1
       ORDER BY a.lesson_date DESC NULLS LAST, a.created_at DESC`;

    let records: any[];
    try {
      records = await this.dbService.query(sqlFull, [studentId]);
    } catch (e: any) {
      if (e?.code === '42703') {
        records = await this.dbService.query(sqlNoNotes, [studentId]);
      } else {
        throw e;
      }
    }

    const present = records.filter((r: any) => String(r.status).toUpperCase().trim() === 'PRESENT').length;
    const total = records.length;
    /** UI «Qoldirdi» barcha PRESENT emas yozuvlar uchun; statistikada ham shu bilan moslashadi. */
    const absent = Math.max(0, total - present);

    const payload = {
      records,
      stats: {
        total_lessons: total,
        present_count: present,
        absent_count: absent,
        attendance_percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      },
    };

    if (this.redisService.isEnabled()) {
      try {
        await this.redisService.set(cacheKey, payload, { ex: 45 });
      } catch {
        /* */
      }
    }

    return payload;
  }

  async getNotifications(studentId: string) {
    return this.dbService.querySafe(
      `SELECT * FROM notifications WHERE student_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [studentId],
      [],
    );
  }

  async markNotificationRead(id: string, studentId: string) {
    return this.dbService.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND student_id = $2`,
      [id, studentId]
    );
  }

  async getStats(studentId: string) {
    const dashboard = await this.getDashboard(studentId);
    if (!dashboard) return null;

    const examRows = Array.isArray(dashboard.exams) ? dashboard.exams : [];
    const scored = examRows
      .map((ex: any) => Number(ex.score))
      .filter((n: number) => !Number.isNaN(n));
    const avgScore =
      scored.length > 0
        ? Math.round(scored.reduce((acc: number, n: number) => acc + n, 0) / scored.length)
        : 0;

    const totalPayments = dashboard.payments?.reduce((acc: number, p: any) => acc + (p.amount || 0), 0) || 0;

    return {
      total_exams: examRows.length,
      average_score: avgScore,
      attendance_percentage: dashboard.attendance_percentage || 0,
      missed_lessons: dashboard.absent_days || 0,
      total_payments: totalPayments,
      ai_status: dashboard.ai_status
    };
  }
}

