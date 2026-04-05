import { DbService } from '../../../infrastructure/database/db.service';

export async function all_groups(dbService: DbService) {
  return dbService.query(`
    SELECT g.*, c.name as course_name, 
           (SELECT COUNT(*) FROM group_students gs WHERE gs.group_id = g.id AND gs.left_at IS NULL) as student_count
    FROM groups g
    LEFT JOIN courses c ON g.course_id = c.id
    WHERE g.deleted_at IS NULL
    ORDER BY g.created_at DESC
  `);
}
