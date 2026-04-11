import { DbService } from '../../../infrastructure/database/db.service';
import { NotFoundException } from '@nestjs/common';

export async function grade_exam(dbService: DbService, examId: string, grades: { student_id: string; score: number; feedback?: string }[]) {
  if (!grades.length) return [];
  
  // Check if exam exists
  const examCheck = await dbService.query(`SELECT id FROM exams WHERE id = $1`, [examId]);
  if (!examCheck.length) throw new NotFoundException('Imtihon topilmadi');

  const valueRows = grades.map((_, i) => `($1, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4})`).join(', ');
  const flatValues = grades.reduce((acc, g) => [...acc, g.student_id, g.score, g.feedback || ''], [examId]);

  const results = await dbService.query(
    `INSERT INTO exam_results (exam_id, student_id, score, feedback) 
     VALUES ${valueRows}
     ON CONFLICT (exam_id, student_id) 
     DO UPDATE SET score = EXCLUDED.score, feedback = EXCLUDED.feedback RETURNING *`,
    flatValues
  );

  return results;
}
