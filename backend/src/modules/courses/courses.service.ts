import { Injectable } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { all_courses } from './queries/all_courses';
import { get_course } from './queries/get_course';
import { get_course_students } from './queries/get_course_students';
import { create_course } from './commands/create_course';
import { update_course } from './commands/update_course';
import { delete_course } from './commands/delete_course';

@Injectable()
export class CoursesService {
  constructor(private readonly dbService: DbService) {}

  async create(data: any, user?: { id: string; role: string }) {
    return create_course(this.dbService, data, user);
  }

  async findAll(user?: { id: string; role: string }) {
    return all_courses(this.dbService, user);
  }

  async findOne(id: string) {
    return get_course(this.dbService, id);
  }

  async getStudents(courseId: string) {
    return get_course_students(this.dbService, courseId);
  }

  async update(id: string, data: any) {
    return update_course(this.dbService, id, data);
  }

  async softDelete(id: string) {
    return delete_course(this.dbService, id);
  }
}
