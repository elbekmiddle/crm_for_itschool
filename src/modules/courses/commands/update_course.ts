import { DbService } from '../../../infrastructure/database/db.service';
import { NotFoundException } from '@nestjs/common';

export async function update_course(dbService: DbService, id: string, data: any) {
  const updates = [];
  const values = [];
  let queryIndex = 1;

  if (data.name) { updates.push(`name = $${queryIndex++}`); values.push(data.name); }
  if (data.price !== undefined) { updates.push(`price = $${queryIndex++}`); values.push(data.price); }

  if (updates.length === 0) return { success: false, message: 'Nothing to update' };
  values.push(id);
  const result = await dbService.query(
    `UPDATE courses SET ${updates.join(', ')} WHERE id = $${queryIndex} AND deleted_at IS NULL RETURNING *`,
    values
  );
  if (!result.length) throw new NotFoundException('Course not found');
  return result[0];
}
