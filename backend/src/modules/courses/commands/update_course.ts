import { DbService } from '../../../infrastructure/database/db.service';
import { NotFoundException } from '@nestjs/common';

export async function update_course(dbService: DbService, id: string, data: any) {
  const updates = [];
  const values = [];
  let queryIndex = 1;

  if (data.name) { updates.push(`name = $${queryIndex++}`); values.push(data.name); }
  if (data.price !== undefined) { updates.push(`price = $${queryIndex++}`); values.push(data.price); }
  if (data.description !== undefined) { updates.push(`description = $${queryIndex++}`); values.push(data.description); }
  if (data.duration_months !== undefined) {
    updates.push(`duration_months = $${queryIndex++}`);
    values.push(data.duration_months === null || data.duration_months === '' ? null : Number(data.duration_months));
  }

  if (updates.length === 0) return { success: false, message: 'Nothing to update' };
  values.push(id);
  const result = await dbService.query(
    `UPDATE courses SET ${updates.join(', ')} WHERE id = $${queryIndex} AND deleted_at IS NULL RETURNING *`,
    values
  );
  if (!result.length) throw new NotFoundException('Course not found');
  return result[0];
}
