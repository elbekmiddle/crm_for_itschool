import { DbService } from '../../database/db.service';

export async function process_exam_questions(
  dbService: DbService, 
  examId: string, 
  lessonId: string, 
  teacherId: string, 
  level: string, 
  questions: string[]
) {
  if (!questions || questions.length === 0) return { added: 0 };

  // Batch insert questions
  const qValues = questions.map((_, i) => `($1, $2, $3, $${i + 4})`).join(', ');
  const qRes = await dbService.query(
    `INSERT INTO questions (lesson_id, created_by, level, text) VALUES ${qValues} RETURNING id`,
    [lessonId, teacherId, level, ...questions]
  );

  const questionIds = qRes.map((q: any) => q.id);
  if (questionIds.length > 0) {
    const eqValues = questionIds.map((_, i) => `($1, $${i + 2})`).join(', ');
    await dbService.query(
      `INSERT INTO exam_questions (exam_id, question_id) VALUES ${eqValues} ON CONFLICT DO NOTHING`,
      [examId, ...questionIds]
    );
  }
  
  return { added: questionIds.length };
}
