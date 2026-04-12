import { Injectable } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { get_questions_by_lesson } from './queries/get_questions_by_lesson';
import { create_question } from './commands/create_question';

@Injectable()
export class QuestionsService {
  constructor(private readonly dbService: DbService) {}

  async create(data: any, createdBy: string) {
    return create_question(this.dbService, data, createdBy);
  }

  async findByLesson(lessonId: string) {
    return get_questions_by_lesson(this.dbService, lessonId);
  }

  async getStats() {
    const res = await this.dbService.query(`SELECT COUNT(*)::text AS c FROM questions`);
    const total = parseInt(res[0]?.c ?? '0', 10) || 0;
    let pendingCount = 0;
    try {
      const p = await this.dbService.query(
        `SELECT COUNT(*)::text AS c FROM questions WHERE COALESCE(status::text, '') IN ('draft', 'pending')`,
      );
      pendingCount = parseInt(p[0]?.c ?? '0', 10) || 0;
    } catch {
      pendingCount = 0;
    }
    return {
      totalQuestions: total,
      checkedRate: null,
      usageCount: null,
      pendingCount,
    };
  }
}
