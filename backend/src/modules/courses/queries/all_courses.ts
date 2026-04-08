import { DbService } from '../../../infrastructure/database/db.service';

function teacherClause(user?: { id: string; role: string }): { sql: string; params: any[] } {
  if (user?.role === 'TEACHER' && user?.id) {
    return {
      sql: ' AND (c.teacher_id = $1 OR c.teacher_id IS NULL)',
      params: [user.id],
    };
  }
  return { sql: '', params: [] };
}

export async function all_courses(dbService: DbService, user?: { id: string; role: string }) {
  const { sql: tsql, params } = teacherClause(user);

  try {
    return await dbService.query(
      `
      SELECT c.*,
             COALESCE(cnt.student_count, 0)::int AS student_count,
             COALESCE(
               NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
               u.email
             ) AS teacher_name
      FROM courses c
      LEFT JOIN users u ON u.id = c.teacher_id
      LEFT JOIN (
        SELECT g.course_id,
               COUNT(DISTINCT gs.student_id) AS student_count
        FROM groups g
        INNER JOIN group_students gs ON gs.group_id = g.id AND (gs.left_at IS NULL)
        GROUP BY g.course_id
      ) cnt ON cnt.course_id = c.id
      WHERE c.deleted_at IS NULL${tsql}
      ORDER BY c.created_at DESC
    `,
      params.length ? params : [],
    );
  } catch (error: any) {
    if (error?.code === '42703') {
      return dbService.querySafe(
        `
        SELECT c.*,
               COALESCE(cnt.student_count, 0)::int AS student_count,
               COALESCE(
                 NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
                 u.email
               ) AS teacher_name
        FROM courses c
        LEFT JOIN users u ON u.id = c.teacher_id
        LEFT JOIN (
          SELECT g.course_id,
                 COUNT(DISTINCT gs.student_id) AS student_count
          FROM groups g
          INNER JOIN group_students gs ON gs.group_id = g.id
          GROUP BY g.course_id
        ) cnt ON cnt.course_id = c.id
        WHERE 1=1${tsql}
        ORDER BY c.created_at DESC
      `,
        params,
        [],
      );
    }
    throw error;
  }
}
