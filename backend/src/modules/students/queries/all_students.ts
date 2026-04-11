import { DbService } from '../../../infrastructure/database/db.service';

export async function all_students(
  dbService: DbService,
  page: number = 1,
  limit: number = 20,
  user?: any,
  compact: boolean = false,
) {
  const offset = (page - 1) * limit;
  let whereStr = 'WHERE deleted_at IS NULL';
  const filterParams: any[] = [];

  if (user?.role === 'TEACHER') {
    const tid = filterParams.length + 1;
    whereStr += ` AND id IN (
      SELECT DISTINCT gs.student_id FROM group_students gs
      INNER JOIN groups g ON gs.group_id = g.id
      WHERE g.teacher_id = $${tid}
        AND g.deleted_at IS NULL
        AND (gs.left_at IS NULL)
      UNION
      SELECT DISTINCT sc.student_id FROM student_courses sc
      INNER JOIN courses c ON c.id = sc.course_id
      WHERE c.teacher_id = $${tid}
        AND c.deleted_at IS NULL
        AND sc.status = 'active'
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

  const dataWhereAliased = dataWhereStr
    .replace('WHERE deleted_at IS NULL', 'WHERE s.deleted_at IS NULL')
    .replace(/\bAND id IN\b/, 'AND s.id IN');

  const selectCols = compact
    ? `s.id, s.first_name, s.last_name, s.phone, s.parent_name, s.status, s.telegram_chat_id, s.telegram_username`
    : `s.*`;

  const dataSql = `
    SELECT ${selectCols},
      (SELECT sc.course_id FROM student_courses sc
       WHERE sc.student_id = s.id AND sc.status = 'active'
       ORDER BY sc.created_at DESC LIMIT 1) AS course_id,
      (SELECT c.name FROM student_courses sc
       JOIN courses c ON c.id = sc.course_id
       WHERE sc.student_id = s.id AND sc.status = 'active'
       ORDER BY sc.created_at DESC LIMIT 1) AS course_name,
      (SELECT g.name FROM group_students gs
       JOIN groups g ON g.id = gs.group_id
       WHERE gs.student_id = s.id AND (gs.left_at IS NULL)
       ORDER BY g.name LIMIT 1) AS group_name
    FROM students s
    ${dataWhereAliased}
    ORDER BY s.created_at DESC LIMIT $1 OFFSET $2`;

  const data = await dbService.querySafe(dataSql, [limit, offset, ...filterParams], []);
  const total = await dbService.querySafe(countSql, filterParams, [{ count: '0' }]);

  const ids = (data || []).map((row: any) => row.id).filter(Boolean);
  const paidSet = new Set<string>();
  if (ids.length > 0) {
    const chunkSize = 200;
    try {
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const paidRows = await dbService.query(
          `SELECT DISTINCT student_id FROM payments
           WHERE student_id = ANY($1::uuid[])
             AND paid_at IS NOT NULL
             AND date_trunc('month', paid_at::timestamp) = date_trunc('month', CURRENT_TIMESTAMP)`,
          [chunk],
        );
        for (const r of paidRows) {
          if (r.student_id) paidSet.add(String(r.student_id));
        }
      }
    } catch {
      /* payments jadvali / ustunlari yo‘q bo‘lsa — ro‘yxat baribir qaytadi */
    }
  }

  const dataWithPaid = (data || []).map((row: any) => ({
    ...row,
    paid_this_month: paidSet.has(String(row.id)),
  }));

  return {
    data: dataWithPaid,
    meta: {
      total: parseInt(total?.[0]?.count ?? '0', 10),
      page,
      limit,
      totalPages: Math.ceil(parseInt(total?.[0]?.count ?? '0', 10) / limit)
    }
  };
}
