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
}
