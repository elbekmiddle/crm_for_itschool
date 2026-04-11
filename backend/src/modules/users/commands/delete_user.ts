import { DbService } from '../../../infrastructure/database/db.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

/** FK larni bo‘shatib, keyin foydalanuvchini o‘chirish (groups / courses / exams.created_by va hokazo). */
export async function delete_user(dbService: DbService, id: string) {
  const client = await dbService.getClient();
  try {
    await client.query('BEGIN');

    const other = await client.query(
      `SELECT id FROM users WHERE id <> $1::uuid ORDER BY CASE WHEN role = 'ADMIN' THEN 0 WHEN role = 'MANAGER' THEN 1 ELSE 2 END LIMIT 1`,
      [id],
    );
    const repId = other.rows[0]?.id as string | undefined;
    if (!repId) {
      await client.query('ROLLBACK');
      throw new ConflictException(
        "Tizimda boshqa foydalanuvchi bo‘lishi kerak. Yoki avval imtihon/savollar muallifini boshqa akkauntga o‘tkazing.",
      );
    }

    await client.query(`UPDATE groups SET teacher_id = NULL WHERE teacher_id = $1::uuid`, [id]);
    await client.query(`UPDATE courses SET teacher_id = NULL WHERE teacher_id = $1::uuid`, [id]);
    await client.query(`UPDATE students SET created_by = NULL WHERE created_by = $1::uuid`, [id]);

    for (const sql of [
      `UPDATE blogs SET created_by = NULL WHERE created_by = $1::uuid`,
      `UPDATE exam_results SET graded_by = NULL WHERE graded_by = $1::uuid`,
    ]) {
      try {
        await client.query(sql, [id]);
      } catch (e: any) {
        if (!['42P01', '42703'].includes(e?.code)) throw e;
      }
    }

    for (const sql of [
      `UPDATE exams SET created_by = $2::uuid WHERE created_by = $1::uuid`,
      `UPDATE questions SET created_by = $2::uuid WHERE created_by = $1::uuid`,
    ]) {
      try {
        await client.query(sql, [id, repId]);
      } catch (e: any) {
        if (!['42P01', '42703'].includes(e?.code)) throw e;
      }
    }

    const del = await client.query(`DELETE FROM users WHERE id = $1::uuid RETURNING id`, [id]);
    await client.query('COMMIT');
    if (!del.rows.length) throw new NotFoundException('Foydalanuvchi topilmadi');
    return del.rows[0];
  } catch (e: any) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    if (e?.code === '23503') {
      throw new ConflictException(
        'Bu foydalanuvchi boshqa jadvallarga bog‘langan. Avval bog‘liqliklarni olib tashlang yoki tizimda yana kamida bitta boshqa akkaunt bo‘lishi kerak.',
      );
    }
    throw e;
  } finally {
    client.release();
  }
}
