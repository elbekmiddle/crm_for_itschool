import { DbService } from '../../../infrastructure/database/db.service';

export async function all_payments(dbService: DbService) {
  try {
    return await dbService.query(`
      SELECT p.*, s.first_name, s.last_name,
        TRIM(CONCAT(COALESCE(s.first_name, ''), ' ', COALESCE(s.last_name, ''))) AS student_name,
        COALESCE(p.paid_at, p.created_at) AS display_date
      FROM payments p
      JOIN students s ON p.student_id = s.id
      ORDER BY COALESCE(p.paid_at, p.created_at) DESC NULLS LAST
    `);
  } catch {
    return dbService.querySafe(
      `
      SELECT p.*, s.first_name, s.last_name,
        TRIM(CONCAT(COALESCE(s.first_name, ''), ' ', COALESCE(s.last_name, ''))) AS student_name
      FROM payments p
      JOIN students s ON p.student_id = s.id
      ORDER BY p.created_at DESC NULLS LAST
      `,
      [],
      [],
    );
  }
}
