import { DbService } from '../../../infrastructure/database/db.service';
import { NotFoundException } from '@nestjs/common';

export async function delete_course(dbService: DbService, id: string) {
  const result = await dbService.query(
    `UPDATE courses SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    [id]
  );
  if (!result.length) throw new NotFoundException('Kurs topilmadi');
  return { success: true };
}
