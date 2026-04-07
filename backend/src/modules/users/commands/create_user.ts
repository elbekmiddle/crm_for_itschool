import { DbService } from '../../../infrastructure/database/db.service';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export async function create_user(dbService: DbService, data: any) {
  const { email, password, role, first_name, last_name, phone } = data;
  const hashedPassword = await bcrypt.hash(password, 10);
  const fn = (first_name || '').trim() || 'User';
  const ln = (last_name || '').trim() || null;
  const ph = phone?.trim() ? phone.trim() : null;

  const tryInsert = async (sql: string, params: any[]) => {
    const result = await dbService.query(sql, params);
    return result[0];
  };

  try {
    return await tryInsert(
      `INSERT INTO users (email, password, role, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role, first_name, last_name, phone, created_at`,
      [email, hashedPassword, role || 'TEACHER', fn, ln, ph],
    );
  } catch (e: any) {
    if (e?.code === '23505') {
      const detail = String(e?.detail || e?.constraint || '');
      if (detail.toLowerCase().includes('phone')) {
        throw new ConflictException(
          "Bu telefon raqami tizimda boshqa foydalanuvchiga biriktirilgan — boshqa raqam kiriting yoki bo'sh qoldiring.",
        );
      }
      throw new ConflictException('Bu email bilan foydalanuvchi allaqachon mavjud');
    }
    if (e?.code === '42703') {
      return await tryInsert(
        `INSERT INTO users (email, password, role, first_name, last_name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, role, first_name, last_name, created_at`,
        [email, hashedPassword, role || 'TEACHER', fn, ln],
      );
    }
    throw e;
  }
}
