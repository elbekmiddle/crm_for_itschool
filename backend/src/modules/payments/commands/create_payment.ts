import { DbService } from '../../../infrastructure/database/db.service';

export async function create_payment(dbService: DbService, data: any) {
  const { student_id, group_id, amount } = data;
  const result = await dbService.query(
    `INSERT INTO payments (student_id, group_id, amount) VALUES ($1, $2, $3) RETURNING *`,
    [student_id, group_id, amount]
  );
  return result[0];
}
