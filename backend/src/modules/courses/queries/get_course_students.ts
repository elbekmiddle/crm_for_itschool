import { DbService } from '../../../infrastructure/database/db.service';

export async function get_course_students(dbService: DbService, courseId: string) {
  const query = `
    SELECT 
      s.id, 
      s.first_name, 
      s.last_name, 
      s.phone,
      CASE WHEN gs.group_id IS NOT NULL THEN 'GROUP' ELSE 'INDIVIDUAL' END as study_type,
      g.name as group_name
    FROM students s
    JOIN student_courses sc ON sc.student_id = s.id
    LEFT JOIN group_students gs ON gs.student_id = s.id
    LEFT JOIN groups g ON g.id = gs.group_id AND g.course_id = sc.course_id
    WHERE sc.course_id = $1 AND s.deleted_at IS NULL
    ORDER BY study_type, s.first_name
  `;
  return dbService.query(query, [courseId]);
}
