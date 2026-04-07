import { DbService } from '../../../infrastructure/database/db.service';

export async function all_users(dbService: DbService) {
  const rows = await dbService.querySafe(
    `SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.photo_url, u.created_at,
            COALESCE(
              (SELECT array_agg(c.id ORDER BY c.name) FROM courses c WHERE c.teacher_id = u.id),
              ARRAY[]::uuid[]
            ) AS teacher_course_ids
     FROM users u
     ORDER BY u.created_at DESC`,
    [],
    [],
  );
  if (rows.length > 0) return rows;
  return dbService.querySafe(
    `SELECT id, email, role, first_name, last_name, created_at FROM users ORDER BY created_at DESC`,
    [],
    [],
  );
}
