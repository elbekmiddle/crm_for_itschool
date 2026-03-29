import { DbService } from '../../../infrastructure/database/db.service';
import { ConflictException } from '@nestjs/common';

export async function mark_attendance(dbService: DbService, data: any) {
  const { group_id, student_id, status, lesson_id, lesson_date } = data;
  const finalDate = lesson_date || new Date().toISOString().split('T')[0];
  
  try {
    const result = await dbService.query(
      `INSERT INTO attendance (group_id, student_id, lesson_id, lesson_date, status) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [group_id, student_id, lesson_id, finalDate, status]
    );
    return result[0];
  } catch (error) {
     throw new ConflictException('Bu talaba uchun ushbu darsga yo`qlama allaqachon qilingan (Duplicate attendance)');
  }
}
