import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ExamsService {
  constructor(private readonly dbService: DbService, private readonly aiService: AiService) {}

  async create(createExamDto: CreateExamDto, teacherId: string) {
    const { title, course_id } = createExamDto;
    const result = await this.dbService.query(
      `INSERT INTO exams (title, course_id, created_by) VALUES ($1, $2, $3) RETURNING *`,
      [title, course_id, teacherId]
    );
    return result[0];
  }

  async addQuestionsToExam(examId: string, questionIds: string[]) {
    const results = [];
    for (const qId of questionIds) {
      const res = await this.dbService.query(
        `INSERT INTO exam_questions (exam_id, question_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`,
        [examId, qId]
      );
      if (res.length) results.push(res[0]);
    }
    return { linked: results.length, total_requested: questionIds.length };
  }

  async generateAiExam(examId: string, lessonId: string, topic: string, level: string, count: number, teacherId: string) {
    const questionsText = await this.aiService.generateExamQuestions(topic, level, count);
    const results = [];
    for (const text of questionsText) {
      const qRes = await this.dbService.query(
        `INSERT INTO questions (lesson_id, created_by, level, text) VALUES ($1, $2, $3, $4) RETURNING id`,
        [lessonId, teacherId, level, text]
      );
      if (qRes.length) {
        const qId = qRes[0].id;
        await this.dbService.query(
          `INSERT INTO exam_questions (exam_id, question_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [examId, qId]
        );
        results.push(qId);
      }
    }
    return { success: true, ai_questions_added: results.length };
  }

  async gradeExam(examId: string, grades: { student_id: string; score: number; feedback?: string }[]) {
    // Check if exam exists
    const examCheck = await this.dbService.query(`SELECT id FROM exams WHERE id = $1`, [examId]);
    if (!examCheck.length) throw new NotFoundException('Exam not found');

    const results = [];
    for (const grade of grades) {
       const res = await this.dbService.query(
         `INSERT INTO exam_results (exam_id, student_id, score, feedback) 
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (exam_id, student_id) 
          DO UPDATE SET score = EXCLUDED.score, feedback = EXCLUDED.feedback RETURNING *`,
         [examId, grade.student_id, grade.score, grade.feedback || '']
       );
       results.push(res[0]);
    }
    return results;
  }

  async findAllByCourse(courseId: string) {
    return this.dbService.query(`SELECT * FROM exams WHERE course_id = $1 ORDER BY created_at DESC`, [courseId]);
  }

  async getExamResults(examId: string) {
    return this.dbService.query(
      `SELECT e.*, s.first_name, s.last_name 
       FROM exam_results e 
       JOIN students s ON e.student_id = s.id 
       WHERE e.exam_id = $1 ORDER BY e.score DESC`, 
       [examId]
    );
  }
}
