import { DbService } from '../../../infrastructure/database/db.service';

export async function all_groups(dbService: DbService) {
  try {
    return await dbService.query(`
      SELECT g.*, c.name as course_name,
             COALESCE(gs.cnt, 0)::int as student_count
      FROM groups g
      LEFT JOIN courses c ON g.course_id = c.id
      LEFT JOIN (
        SELECT group_id, COUNT(*)::int AS cnt
        FROM group_students
        WHERE left_at IS NULL
        GROUP BY group_id
      ) gs ON gs.group_id = g.id
      WHERE g.deleted_at IS NULL
      ORDER BY g.created_at DESC
    `);
  } catch (error: any) {
    if (error?.code === '42703') {
      return dbService.querySafe(
        `
        SELECT g.*, c.name as course_name,
               COALESCE(gs.cnt, 0)::int as student_count
        FROM groups g
        LEFT JOIN courses c ON g.course_id = c.id
        LEFT JOIN (
          SELECT group_id, COUNT(*)::int AS cnt
          FROM group_students
          WHERE left_at IS NULL
          GROUP BY group_id
        ) gs ON gs.group_id = g.id
        ORDER BY g.created_at DESC
      `,
        [],
        [],
      );
    }
    throw error;
  }
}
