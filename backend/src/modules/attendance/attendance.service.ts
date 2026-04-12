import { Injectable, ForbiddenException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { get_group_attendance } from './queries/get_group_attendance';
import { get_individual_attendance } from './queries/get_individual_attendance';
import { can_teacher_individual_attendance } from './queries/can_teacher_individual_attendance';
import { mark_attendance } from './commands/mark_attendance';
import { update_attendance } from './commands/update_attendance';
import { AiService } from '../ai/ai.service';

import { TelegramService } from '../../infrastructure/notifications/telegram.service';
import { SocketsGateway } from '../sockets/sockets.gateway';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly dbService: DbService,
    private readonly aiService: AiService,
    private readonly telegramService: TelegramService,
    private readonly socketsGateway: SocketsGateway
  ) {}

  async markAttendance(data: any, user?: { id: string }) {
    const noGroup = data.group_id == null || data.group_id === '';
    if (noGroup) {
      if (!user?.id) throw new UnauthorizedException();
      await this.assertTeacherCanMarkIndividual(user.id, data.student_id);
    }

    const result = await mark_attendance(this.dbService, data);
    this.socketsGateway.emitDashboardRefresh({
      source: 'attendance',
      action: 'marked',
      groupId: data.group_id,
      status: data.status,
    });

    if (data.status === 'ABSENT') {
       this.socketsGateway.emitToAll('attendance_missed', {
         studentId: data.student_id,
         groupId: data.group_id ?? null,
       });

       void this.aiService
         .getStudentHumorStatus({
           status: 'ABSENT',
           group_id: data.group_id,
           student_id: data.student_id,
         })
         .then((aiComment) => {
           this.socketsGateway.emitToRoom(`user:${data.student_id}`, 'ai_comment', { aiComment });
         })
         .catch(() => {});

       try {
         const student = await this.dbService.query(`SELECT first_name, telegram_chat_id, parent_phone FROM students WHERE id = $1`, [data.student_id]);
         let courseName = 'Kurs';
         if (data.group_id) {
           const group = await this.dbService.query(
             `SELECT c.name as course_name FROM groups g JOIN courses c ON g.course_id = c.id WHERE g.id = $1`,
             [data.group_id],
           );
           courseName = group[0]?.course_name || courseName;
         } else {
           const c = await this.dbService.query(
             `SELECT c.name AS course_name FROM student_courses sc
              JOIN courses c ON c.id = sc.course_id
              WHERE sc.student_id = $1 AND sc.status = 'active'
              ORDER BY sc.created_at DESC LIMIT 1`,
             [data.student_id],
           );
           courseName = c[0]?.course_name || courseName;
         }

         if (student.length && student[0].telegram_chat_id) {
           await this.telegramService.notifyAbsent(
             student[0].telegram_chat_id,
             student[0].first_name,
             courseName,
             data.lesson_date,
             data.student_id,
           );
         }
       } catch (e) {
         // Non-blocking
       }
    }

    return result;
  }

  async getGroupAttendance(groupId: string) {
    return get_group_attendance(this.dbService, groupId);
  }

  /** Faqat ustoz o‘z kursiga yozilgan, guruhda bo‘lmagan talabasining davomatini ko‘radi */
  async getIndividualAttendance(studentId: string, teacherId: string) {
    const ok = await can_teacher_individual_attendance(this.dbService, teacherId, studentId);
    if (!ok) {
      throw new ForbiddenException('Bu talaba uchun individual davomatni ko‘rish huquqi yo‘q');
    }
    return get_individual_attendance(this.dbService, studentId);
  }

  /** Individual davomat yozishdan oldin (POST /attendance) */
  async assertTeacherCanMarkIndividual(teacherId: string, studentId: string) {
    const ok = await can_teacher_individual_attendance(this.dbService, teacherId, studentId);
    if (!ok) {
      throw new ForbiddenException('Bu talaba uchun davomat belgilash mumkin emas');
    }
  }

  async update(id: string, status: string) {
    const allowed = new Set(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']);
    const u = String(status || '').toUpperCase();
    if (!allowed.has(u)) {
      throw new BadRequestException(`Holat noto'g'ri. Ruxsat: ${[...allowed].join(', ')}`);
    }
    const row = await update_attendance(this.dbService, id, u);
    this.socketsGateway.emitDashboardRefresh({ source: 'attendance', action: 'updated' });
    return row;
  }
}

