import { DbService } from '../../../infrastructure/database/db.service';

export async function all_students(dbService: DbService, page: number = 1, limit: number = 20, user?: any) {
  const offset = (page - 1) * limit;
  let whereStr = 'WHERE deleted_at IS NULL';
  const filterParams: any[] = [];

  if (user?.role === 'TEACHER') {
    whereStr += ` AND id IN (
      SELECT student_id FROM group_students gs 
      JOIN groups g ON gs.group_id = g.id 
      WHERE g.teacher_id = $${filterParams.length + 1}
    )`;
    filterParams.push(user.id);
  }

  // Count query parameters are just the filterParams
  const countSql = `SELECT COUNT(*) FROM students ${whereStr}`;
  
  // Data query parameters are [limit, offset, ...filterParams]
  // We need to adjust $ indices in whereStr for the data query if they exist
  let dataWhereStr = whereStr;
  if (filterParams.length > 0) {
     // Replace $1 with $3, etc. for the data query because $1,$2 are limit/offset
     dataWhereStr = whereStr.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + 2}`);
  }
  
  const dataSql = `SELECT * FROM students ${dataWhereStr} ORDER BY created_at DESC LIMIT $1 OFFSET $2`;

  const [data, total] = await Promise.all([
    dbService.query(dataSql, [limit, offset, ...filterParams]),
    dbService.query(countSql, filterParams)
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
