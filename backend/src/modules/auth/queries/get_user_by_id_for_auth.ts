import { DbService } from '../../../infrastructure/database/db.service';

export async function get_user_by_id_for_auth(dbService: DbService, id: string) {
  const full = await dbService.querySafe(
    `SELECT id, email, role, first_name, last_name, phone, photo_url, profile_completed_pct
     FROM users WHERE id = $1`,
    [id],
    [],
  );
  if (full.length) return full;
  return dbService.querySafe(
    `SELECT id, email, role, first_name, last_name, phone FROM users WHERE id = $1`,
    [id],
    [],
  );
}
