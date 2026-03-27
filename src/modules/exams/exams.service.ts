import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { CreateExamDto } from './dto/create-exam.dto';

@Injectable()
export class ExamsService {
  constructor(private readonly dbService: DbService) {}

  async create(createExamDto: CreateExamDto, teacherId: string) {
    const { title, course_id } = createExamDto;
    const result = await this.dbService.query(
      `INSERT INTO exams (title, course_id, teacher_id) VALUES ($1, $2, $3) RETURNING *`,
      [title, course_id, teacherId]
    );
    return result[0];
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
