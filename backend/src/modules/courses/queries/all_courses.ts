import { DbService } from '../../../infrastructure/database/db.service';

export async function all_courses(dbService: DbService) {
  return dbService.query(`
    SELECT c.*, 
           (SELECT COUNT(*) FROM student_courses sc WHERE sc.course_id = c.id AND sc.status = 'active') as student_count
    FROM courses c
    WHERE c.deleted_at IS NULL
    ORDER BY c.created_at DESC
  `);
}
