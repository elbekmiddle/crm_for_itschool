import { Injectable, ConflictException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly dbService: DbService) {}

  async markAttendance(data: any) {
    const { group_id, student_id, status, lesson_date } = data;
    
    try {
      const result = await this.dbService.query(
        `INSERT INTO attendance (group_id, student_id, lesson_date, status) 
         VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4) RETURNING *`,
        [group_id, student_id, lesson_date || null, status]
      );
      return result[0];
    } catch (error) {
       throw new ConflictException('Attendance already marked for this student today');
    }
  }

  async getGroupAttendance(groupId: string) {
    return this.dbService.query(
      `SELECT * FROM attendance WHERE group_id = $1 ORDER BY lesson_date DESC`,
      [groupId]
    );
  }
}
