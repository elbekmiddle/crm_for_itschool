import { DbService } from '../../../infrastructure/database/db.service';

export async function get_student_payments_raw(dbService: DbService, studentId: string) {
  return dbService.query(
    `SELECT * FROM payments WHERE student_id = $1 ORDER BY paid_at DESC`,
    [studentId]
  );
}
