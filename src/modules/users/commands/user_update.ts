import { DbService } from '../../../infrastructure/database/db.service';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export async function user_update(dbService: DbService, id: string, data: any) {
  const updates = [];
  const values = [];
  let queryIndex = 1;

  if (data.email) {
    updates.push(`email = $${queryIndex++}`);
    values.push(data.email);
  }
  if (data.password) {
    updates.push(`password = $${queryIndex++}`);
    const hashedPassword = await bcrypt.hash(data.password, 10);
    values.push(hashedPassword);
  }
  if (data.role) {
    updates.push(`role = $${queryIndex++}`);
    values.push(data.role);
  }

  if (updates.length === 0) return { success: false, message: 'Nothing to update' };

  values.push(id);
  const result = await dbService.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${queryIndex} RETURNING id, email, role, created_at`,
    values
  );
  if (!result.length) throw new NotFoundException('User not found');
  return result[0];
}
