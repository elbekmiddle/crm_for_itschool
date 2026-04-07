import { DbService } from '../../../infrastructure/database/db.service';

export async function all_courses(dbService: DbService) {
  try {
    return await dbService.query(`
      SELECT c.*,
             (
               SELECT COUNT(DISTINCT gs.student_id)
               FROM group_students gs
               JOIN groups g ON g.id = gs.group_id
               WHERE g.course_id = c.id AND (gs.left_at IS NULL)
             ) as student_count,
             COALESCE(
               NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
               u.email
             ) AS teacher_name
      FROM courses c
      LEFT JOIN users u ON u.id = c.teacher_id
      WHERE c.deleted_at IS NULL
      ORDER BY c.created_at DESC
    `);
  } catch (error: any) {
    // Backward compatibility: older schemas may not have deleted_at column.
    if (error?.code === '42703') {
      return dbService.querySafe(`
        SELECT c.*,
               (
                 SELECT COUNT(DISTINCT gs.student_id)
                 FROM group_students gs
                 JOIN groups g ON g.id = gs.group_id
                 WHERE g.course_id = c.id AND (gs.left_at IS NULL)
               ) as student_count,
               COALESCE(
                 NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
                 u.email
               ) AS teacher_name
        FROM courses c
        LEFT JOIN users u ON u.id = c.teacher_id
        ORDER BY c.created_at DESC
      `, [], []);
    }
    throw error;
  }
}
