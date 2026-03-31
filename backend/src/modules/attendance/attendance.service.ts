import { Injectable } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { get_group_attendance } from './queries/get_group_attendance';
import { mark_attendance } from './commands/mark_attendance';
import { update_attendance } from './commands/update_attendance';
import { AiService } from '../ai/ai.service';

import { TelegramService } from '../../infrastructure/notifications/telegram.service';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly dbService: DbService,
    private readonly aiService: AiService,
    private readonly telegramService: TelegramService
  ) {}

  async markAttendance(data: any) {
    const result = await mark_attendance(this.dbService, data);
    
    // If student is ABSENT, maybe get a funny AI status and notify
    if (data.status === 'ABSENT') {
       const aiComment = await this.aiService.getStudentHumorStatus({
         status: 'ABSENT',
         group_id: data.group_id,
         student_id: data.student_id
       });

       try {
         const student = await this.dbService.query(`SELECT first_name, telegram_chat_id, parent_phone FROM students WHERE id = $1`, [data.student_id]);
         const group = await this.dbService.query(`SELECT c.name as course_name FROM groups g JOIN courses c ON g.course_id = c.id WHERE g.id = $1`, [data.group_id]);
         
         if (student.length && student[0].telegram_chat_id) {
           await this.telegramService.notifyAbsent(
             student[0].telegram_chat_id, 
             student[0].first_name, 
             group[0]?.course_name || 'Kurs', 
             data.lesson_date,
             data.student_id
           );
         }
       } catch (e) {
         // Non-blocking
       }

       return { ...result, ai_comment: aiComment };
    }
    
    return result;
  }

  async getGroupAttendance(groupId: string) {
    return get_group_attendance(this.dbService, groupId);
  }

  async update(id: string, status: string) {
    return update_attendance(this.dbService, id, status);
  }
}

