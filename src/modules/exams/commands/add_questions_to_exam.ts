import { DbService } from '../../../infrastructure/database/db.service';

export async function add_questions_to_exam(dbService: DbService, examId: string, questionIds: string[]) {
  if (!questionIds.length) return { linked: 0, total_requested: 0 };
  
  const values = questionIds.map((_, i) => `($1, $${i + 2})`).join(', ');
  const res = await dbService.query(
    `INSERT INTO exam_questions (exam_id, question_id) VALUES ${values} ON CONFLICT DO NOTHING RETURNING *`,
    [examId, ...questionIds]
  );
  
  return { linked: res.length, total_requested: questionIds.length };
}
