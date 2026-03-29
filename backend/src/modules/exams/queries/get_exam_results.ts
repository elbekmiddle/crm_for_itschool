import { DbService } from '../../../infrastructure/database/db.service';

export async function get_exam_results(dbService: DbService, examId: string) {
  return dbService.query(
    `SELECT e.*, s.first_name, s.last_name 
     FROM exam_results e 
     JOIN students s ON e.student_id = s.id 
     WHERE e.exam_id = $1 ORDER BY e.score DESC`, 
     [examId]
  );
}
