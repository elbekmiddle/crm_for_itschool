import { Injectable } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { AiService } from '../ai/ai.service';
import { QueueService } from '../../infrastructure/queue/queue.service';
import { all_exams_by_course } from './queries/all_exams_by_course';
import { get_exam_results } from './queries/get_exam_results';
import { create_exam } from './commands/create_exam';
import { add_questions_to_exam } from './commands/add_questions_to_exam';
import { grade_exam } from './commands/grade_exam';

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
