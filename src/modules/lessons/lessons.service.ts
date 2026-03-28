import { Injectable } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';

@Injectable()
export class LessonsService {
  constructor(private readonly dbService: DbService) {}

  async create(data: any) {
    const { course_id, title } = data;
    const result = await this.dbService.query(
      `INSERT INTO lessons (course_id, title) VALUES ($1, $2) RETURNING *`,
      [course_id, title]
    );
    return result[0];
  }

  async findByCourse(courseId: string) {
    return this.dbService.query(
      `SELECT * FROM lessons WHERE course_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC`,
      [courseId]
    );
  }
}
