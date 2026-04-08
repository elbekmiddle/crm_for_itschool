import { DbService } from '../../database/db.service';
import { insertQuestionCompat } from '../../../modules/exams/commands/insert_question_compat';

export async function process_exam_questions(
  dbService: DbService,
  examId: string,
  lessonId: string | null,
  teacherId: string,
  level: string,
  questions: any[],
) {
  if (!questions || questions.length === 0) return { added: 0 };

  const questionIds: string[] = [];

  for (const q of questions) {
    const rawType = String(q?.type || 'multiple_choice').toLowerCase().replace(/-/g, '_');
    const id = await insertQuestionCompat(dbService, {
      lessonId: lessonId || null,
      createdBy: teacherId,
      level,
      text: q.text,
      optionsJson: JSON.stringify(q.options || []),
      correctJson: JSON.stringify(
        q.correct_answer !== undefined && q.correct_answer !== null
          ? q.correct_answer
          : rawType === 'multiple_select'
            ? []
            : 0,
      ),
      type: rawType,
    });
    questionIds.push(id);
  }

  if (questionIds.length > 0) {
    for (const qid of questionIds) {
      try {
        await dbService.query(`INSERT INTO exam_questions (exam_id, question_id) VALUES ($1, $2)`, [
          examId,
          qid,
        ]);
      } catch (e: any) {
        if (e?.code !== '23505') throw e;
      }
    }
  }

  return { added: questionIds.length };
}
