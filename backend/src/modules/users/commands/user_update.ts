import { DbService } from '../../../infrastructure/database/db.service';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export async function user_update(dbService: DbService, id: string, data: any) {
  const updates: string[] = [];
  const values: any[] = [];
  let queryIndex = 1;

  const fields = [
    'email', 'role', 'first_name', 'last_name', 'phone', 
    'photo_url', 'telegram_chat_id', 'profile_completed_pct'
  ];

  for (const field of fields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = $${queryIndex++}`);
      values.push(data[field]);
    }
  }

  if (data.password) {
    updates.push(`password = $${queryIndex++}`);
    const hashedPassword = await bcrypt.hash(data.password, 10);
    values.push(hashedPassword);
  }

  if (updates.length === 0) return { success: false, message: 'Nothing to update' };

  values.push(id);
  const result = await dbService.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${queryIndex} RETURNING id, email, role, first_name, last_name, photo_url, profile_completed_pct`,
    values
  );
  if (!result.length) throw new NotFoundException('Foydalanuvchi topilmadi');
  return result[0];
}
