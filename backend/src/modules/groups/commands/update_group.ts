import { DbService } from '../../../infrastructure/database/db.service';
import { NotFoundException } from '@nestjs/common';

export async function update_group(dbService: DbService, id: string, data: any) {
  const updates = [];
  const values = [];
  let queryIndex = 1;

  if (data.name) {
    updates.push(`name = $${queryIndex++}`);
    values.push(data.name);
  }
  if (data.course_id) {
    updates.push(`course_id = $${queryIndex++}`);
    values.push(data.course_id);
  }
  if (data.teacher_id) {
    updates.push(`teacher_id = $${queryIndex++}`);
    values.push(data.teacher_id);
  }
  if (data.schedule !== undefined) {
    updates.push(`schedule = $${queryIndex++}`);
    values.push(data.schedule);
  }
  const cap = data.capacity ?? data.max_students;
  if (cap != null && cap !== '') {
    updates.push(`capacity = $${queryIndex++}`);
    values.push(Number(cap));
  }

  if (updates.length === 0) return { success: false, message: 'Nothing to update' };
  values.push(id);
  const result = await dbService.query(
    `UPDATE groups SET ${updates.join(', ')} WHERE id = $${queryIndex} AND deleted_at IS NULL RETURNING *`,
    values
  );
  if (!result.length) throw new NotFoundException('Guruh topilmadi');
  return result[0];
}
