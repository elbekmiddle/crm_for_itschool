import { Injectable } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { get_group_attendance } from './queries/get_group_attendance';
import { mark_attendance } from './commands/mark_attendance';
import { update_attendance } from './commands/update_attendance';
import { AiService } from '../ai/ai.service';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly dbService: DbService,
    private readonly aiService: AiService
  ) {}

  async markAttendance(data: any) {
    const result = await mark_attendance(this.dbService, data);
    
    // If student is ABSENT, maybe get a funny AI status
    if (data.status === 'ABSENT') {
       const aiComment = await this.aiService.getStudentHumorStatus({
         status: 'ABSENT',
         group_id: data.group_id,
         student_id: data.student_id
       });
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

