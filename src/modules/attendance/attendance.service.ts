import { Injectable, ConflictException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly dbService: DbService) {}

  async markAttendance(data: any) {
    const { group_id, student_id, status, lesson_id } = data;
    
    try {
      const result = await this.dbService.query(
        `INSERT INTO attendance (group_id, student_id, lesson_id, status) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [group_id, student_id, lesson_id, status]
      );
      return result[0];
    } catch (error) {
       throw new ConflictException('Attendance already marked for this student today');
    }
  }

  async getGroupAttendance(groupId: string) {
    return this.dbService.query(
      `SELECT * FROM attendance WHERE group_id = $1 ORDER BY created_at DESC`,
      [groupId]
    );
  }
}
