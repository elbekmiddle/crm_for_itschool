import { DbService } from '../../../infrastructure/database/db.service';

export async function all_groups(dbService: DbService) {
  try {
    return await dbService.query(`
      SELECT g.*, c.name as course_name,
             (SELECT COUNT(*) FROM group_students gs WHERE gs.group_id = g.id) as student_count
      FROM groups g
      LEFT JOIN courses c ON g.course_id = c.id
      WHERE g.deleted_at IS NULL
      ORDER BY g.created_at DESC
    `);
  } catch (error: any) {
    // Backward compatibility: older schemas may not have deleted_at column.
    if (error?.code === '42703') {
      return dbService.querySafe(`
        SELECT g.*, c.name as course_name,
               (SELECT COUNT(*) FROM group_students gs WHERE gs.group_id = g.id) as student_count
        FROM groups g
        LEFT JOIN courses c ON g.course_id = c.id
        ORDER BY g.created_at DESC
      `, [], []);
    }
    throw error;
  }
}
