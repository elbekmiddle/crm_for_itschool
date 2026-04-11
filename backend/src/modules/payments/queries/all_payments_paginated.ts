import { DbService } from '../../../infrastructure/database/db.service';

export async function count_payments(dbService: DbService): Promise<number> {
  try {
    const rows = await dbService.query(`SELECT COUNT(*)::text AS c FROM payments`);
    return parseInt(rows?.[0]?.c ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

export async function all_payments_page(dbService: DbService, limit: number, offset: number) {
  try {
    return await dbService.query(
      `
      SELECT p.*, s.first_name, s.last_name,
        TRIM(CONCAT(COALESCE(s.first_name, ''), ' ', COALESCE(s.last_name, ''))) AS student_name,
        COALESCE(p.paid_at, p.created_at) AS display_date
      FROM payments p
      JOIN students s ON p.student_id = s.id
      ORDER BY COALESCE(p.paid_at, p.created_at) DESC NULLS LAST
      LIMIT $1 OFFSET $2
    `,
      [limit, offset],
    );
  } catch {
    return dbService.querySafe(
      `
      SELECT p.*, s.first_name, s.last_name,
        TRIM(CONCAT(COALESCE(s.first_name, ''), ' ', COALESCE(s.last_name, ''))) AS student_name
      FROM payments p
      JOIN students s ON p.student_id = s.id
      ORDER BY p.created_at DESC NULLS LAST
      LIMIT $1 OFFSET $2
    `,
      [limit, offset],
      [],
    );
  }
}
