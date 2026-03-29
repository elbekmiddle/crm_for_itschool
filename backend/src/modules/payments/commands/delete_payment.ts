import { DbService } from '../../../infrastructure/database/db.service';

export async function delete_payment(dbService: DbService, id: string) {
  const result = await dbService.query(
    `DELETE FROM payments WHERE id = $1 RETURNING id`,
    [id]
  );
  return result[0];
}
