import { DbService } from '../../../infrastructure/database/db.service';

export async function all_students(dbService: DbService, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    dbService.query(
      `SELECT * FROM students WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    dbService.query(`SELECT COUNT(*) FROM students WHERE deleted_at IS NULL`)
  ]);

  return {
    data,
    meta: {
      total: parseInt(total[0].count, 10),
      page,
      limit,
      totalPages: Math.ceil(parseInt(total[0].count, 10) / limit)
    }
  };
}
