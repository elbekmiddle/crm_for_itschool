import { DbService } from '../../../infrastructure/database/db.service';

export type InsertQuestionCompatInput = {
  lessonId: string | null;
  createdBy: string;
  level: string;
  text: string;
  optionsJson: string;
  correctJson: string;
  type: string;
};

/**
 * INSERT into questions with fallbacks for older DBs (missing status and/or type columns).
 * Order: type without status first — avoids failed attempts on common legacy schemas.
 */
export async function insertQuestionCompat(
  dbService: DbService,
  input: InsertQuestionCompatInput,
): Promise<string> {
  const { lessonId, createdBy, level, text, optionsJson, correctJson, type } = input;
  const t = String(type || 'multiple_choice').replace(/-/g, '_');

  const attempts: { sql: string; params: any[] }[] = [
    {
      sql: `INSERT INTO questions (lesson_id, created_by, level, text, options, correct_answer, type)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      params: [lessonId, createdBy, level, text, optionsJson, correctJson, t],
    },
    {
      sql: `INSERT INTO questions (lesson_id, created_by, level, text, options, correct_answer, type, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft') RETURNING id`,
      params: [lessonId, createdBy, level, text, optionsJson, correctJson, t],
    },
    {
      sql: `INSERT INTO questions (lesson_id, created_by, level, text, options, correct_answer)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      params: [lessonId, createdBy, level, text, optionsJson, correctJson],
    },
  ];

  let lastErr: any;
  for (const { sql, params } of attempts) {
    try {
      const res = await dbService.query<{ id: string }>(sql, params);
      return res[0].id;
    } catch (e: any) {
      lastErr = e;
      if (e?.code !== '42703') {
        throw e;
      }
    }
  }
  throw lastErr || new Error('questions jadvaliga yozib bo‘lmadi (sxema mos kelmayapti)');
}
