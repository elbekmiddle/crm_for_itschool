import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { AiService } from '../ai/ai.service';
import { QueueService } from '../../infrastructure/queue/queue.service';
import { all_exams_by_course } from './queries/all_exams_by_course';
import { get_exam_results } from './queries/get_exam_results';
import { create_exam } from './commands/create_exam';
import { add_questions_to_exam } from './commands/add_questions_to_exam';
import { grade_exam } from './commands/grade_exam';
import * as dayjs from 'dayjs';

@Injectable()
export class ExamsService {
  constructor(
    private readonly dbService: DbService, 
    private readonly aiService: AiService,
    private readonly queueService: QueueService
  ) {}

  async create(createExamDto: CreateExamDto, teacherId: string) {
    return create_exam(this.dbService, createExamDto, teacherId);
  }

  async startExam(examId: string, studentId: string) {
    // 1. Check student status
    const student = await this.dbService.query(`SELECT status FROM students WHERE id = $1`, [studentId]);
    if (!student.length || student[0].status !== 'active') {
      throw new BadRequestException('Inactive student cannot take exams.');
    }

    // 2. Load session and limit
    const session = await this.dbService.query(
      `SELECT er.*, ex.time_limit 
       FROM exam_results er 
       JOIN exams ex ON er.exam_id = ex.id 
       WHERE er.exam_id = $1 AND er.student_id = $2`,
      [examId, studentId]
    );

    if (session.length > 0) {
      const { started_at, finished_at, time_limit } = session[0];
      
      if (finished_at) {
        throw new ConflictException('Exam already submitted.');
      }

      // 3. Auto-close if time limit exceeded
      const now = dayjs();
      if (now.diff(dayjs(started_at), 'minute') > time_limit) {
        await this.dbService.query(
          `UPDATE exam_results SET finished_at = started_at + interval '1 minute' * $3, score = 0, duration = $3 
           WHERE exam_id = $1 AND student_id = $2`,
          [examId, studentId, time_limit]
        );
        throw new ConflictException('Exam time limit exceeded. Session auto-closed with 0 score.');
      }

      return { message: 'Exam resumed', started_at };
    }

    // 4. Start new session
    const result = await this.dbService.query(
      `INSERT INTO exam_results (exam_id, student_id, started_at) VALUES ($1, $2, NOW()) RETURNING *`,
      [examId, studentId]
    );
    return result[0];
  }

  async submitExam(examId: string, studentId: string, score: number) {
    const session = await this.dbService.query(
      `SELECT er.*, ex.time_limit 
       FROM exam_results er
       JOIN exams ex ON er.exam_id = ex.id
       WHERE er.exam_id = $1 AND er.student_id = $2`,
      [examId, studentId]
    );

    if (!session.length) throw new BadRequestException('Exam not started.');
    if (session[0].finished_at) throw new ConflictException('Already submitted.');

    const { started_at, time_limit } = session[0];
    const duration = dayjs().diff(dayjs(started_at), 'minute');

    // Rule: If time exceeded, cap score or mark as auto-submitted
    let finalScore = score;
    if (duration > time_limit + 2) { // 2 min grace period for network
       finalScore = Math.min(score, 50); // Penalty for late submission
    }

    const result = await this.dbService.query(
      `UPDATE exam_results 
       SET finished_at = NOW(), score = $3, duration = $4 
       WHERE exam_id = $1 AND student_id = $2
       RETURNING *`,
      [examId, studentId, finalScore, duration]
    );

    return result[0];
  }

  async addQuestionsToExam(examId: string, questionIds: string[]) {
    return add_questions_to_exam(this.dbService, examId, questionIds);
  }

  async generateAiExam(examId: string, lessonId: string, topic: string, level: string, count: number, teacherId: string) {
    const job = await this.queueService.addExamJob({
      examId,
      lessonId,
      topic,
      level,
      count,
      teacherId
    });

    return { 
      success: true, 
      message: 'AI Exam generation queued.',
      jobId: job?.id 
    };
  }

  async gradeExam(examId: string, grades: { student_id: string; score: number; feedback?: string }[]) {
    return grade_exam(this.dbService, examId, grades);
  }

  async findAllByCourse(courseId: string) {
    return all_exams_by_course(this.dbService, courseId);
  }

  async getExamResults(examId: string) {
    return get_exam_results(this.dbService, examId);
  }
}
