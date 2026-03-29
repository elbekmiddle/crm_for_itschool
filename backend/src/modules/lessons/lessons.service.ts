import { Injectable } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { get_lessons_by_course } from './queries/get_lessons_by_course';
import { create_lesson } from './commands/create_lesson';

@Injectable()
export class LessonsService {
  constructor(private readonly dbService: DbService) {}

  async create(data: any) {
    return create_lesson(this.dbService, data);
  }

  async findByCourse(courseId: string) {
    return get_lessons_by_course(this.dbService, courseId);
  }
}
