import { DbService } from '../../database/db.service';

export async function process_exam_questions(
  dbService: DbService, 
  examId: string, 
  lessonId: string, 
  teacherId: string, 
  level: string, 
  questions: any[]
) {
  if (!questions || questions.length === 0) return { added: 0 };

  const questionIds: string[] = [];

  for (const q of questions) {
    const res = await dbService.query(`
      INSERT INTO questions (lesson_id, created_by, level, text, options, correct_answer, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'draft') RETURNING id
    `, [
      lessonId, 
      teacherId, 
      level, 
      q.text, 
      JSON.stringify(q.options || []), 
      JSON.stringify(q.correct_answer || 0)
    ]);
    questionIds.push(res[0].id);
  }

  if (questionIds.length > 0) {
    const eqValues = questionIds.map((_, i) => `($1, $${i + 2})`).join(', ');
    await dbService.query(
      `INSERT INTO exam_questions (exam_id, question_id) VALUES ${eqValues} ON CONFLICT DO NOTHING`,
      [examId, ...questionIds]
    );
  }
  
  return { added: questionIds.length };
}
