import { DbService } from '../../../infrastructure/database/db.service';

export async function all_payments(dbService: DbService) {
  return dbService.query(`
    SELECT p.*, s.first_name, s.last_name, s.first_name || ' ' || s.last_name as student_name
    FROM payments p
    JOIN students s ON p.student_id = s.id
    ORDER BY p.paid_at DESC
  `);
}
