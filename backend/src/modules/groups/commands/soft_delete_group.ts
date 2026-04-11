import { DbService } from '../../../infrastructure/database/db.service';
import { NotFoundException } from '@nestjs/common';

export async function soft_delete_group(dbService: DbService, id: string) {
  const result = await dbService.query(
    `DELETE FROM groups WHERE id = $1 RETURNING id`,
    [id]
  );
  if (!result.length) throw new NotFoundException('Guruh topilmadi');
  return { success: true };
}
