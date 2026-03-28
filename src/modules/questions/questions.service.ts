import { Injectable } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';

@Injectable()
export class QuestionsService {
  constructor(private readonly dbService: DbService) {}

  async create(data: any, createdBy: string) {
    const { lesson_id, level, text } = data;
    const result = await this.dbService.query(
      `INSERT INTO questions (lesson_id, created_by, level, text) VALUES ($1, $2, $3, $4) RETURNING *`,
      [lesson_id, createdBy, level, text]
    );
    return result[0];
  }

  async findByLesson(lessonId: string) {
    return this.dbService.query(
      `SELECT * FROM questions WHERE lesson_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC`,
      [lessonId]
    );
  }
}
