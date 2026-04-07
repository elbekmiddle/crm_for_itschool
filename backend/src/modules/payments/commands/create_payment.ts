import { DbService } from '../../../infrastructure/database/db.service';

export async function create_payment(dbService: DbService, data: any) {
  const { student_id, group_id = null, amount, payment_method = 'cash', description = null } = data;
  try {
    const result = await dbService.query(
      `INSERT INTO payments (student_id, group_id, amount, paid_at, status, payment_method, description)
       VALUES ($1, $2, $3, NOW(), 'completed', $4, $5) RETURNING *`,
      [student_id, group_id, amount, payment_method, description],
    );
    return result[0];
  } catch (e: any) {
    if (e?.code === '42703') {
      const result = await dbService.query(
        `INSERT INTO payments (student_id, group_id, amount) VALUES ($1, $2, $3) RETURNING *`,
        [student_id, group_id, amount],
      );
      return result[0];
    }
    throw e;
  }
}
