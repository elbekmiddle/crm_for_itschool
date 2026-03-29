import { DbService } from '../../../infrastructure/database/db.service';

export async function all_students(dbService: DbService, page: number = 1, limit: number = 20, user?: any) {
  const offset = (page - 1) * limit;
  let whereClause = 'WHERE deleted_at IS NULL';
  const queryParams: any[] = [limit, offset];

  if (user?.role === 'TEACHER') {
    whereClause += ` AND id IN (
      SELECT student_id FROM group_students gs 
      JOIN groups g ON gs.group_id = g.id 
      WHERE g.teacher_id = $3
    )`;
    queryParams.push(user.id);
  }
  
  const [data, total] = await Promise.all([
    dbService.query(
      `SELECT * FROM students ${whereClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      queryParams
    ),
    dbService.query(`SELECT COUNT(*) FROM students ${whereClause}`, queryParams.slice(2))
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
