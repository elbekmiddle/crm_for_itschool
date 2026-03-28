import { Injectable } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { all_students } from './queries/all_students';
import { get_student } from './queries/get_student';
import { create_student } from './commands/create_student';
import { update_student } from './commands/update_student';
import { delete_student } from './commands/delete_student';

import { enroll_student } from './commands/enroll_student';

@Injectable()
export class StudentsService {
  constructor(private readonly dbService: DbService) {}

  async create(createStudentDto: CreateStudentDto, createdBy: string) {
    return create_student(this.dbService, createStudentDto, createdBy);
  }

  async findAll(page: number = 1, limit: number = 20) {
    return all_students(this.dbService, page, limit);
  }

  async findOne(id: string) {
    return get_student(this.dbService, id);
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    return update_student(this.dbService, id, updateStudentDto);
  }

  async remove(id: string) {
    return delete_student(this.dbService, id);
  }

  async enroll(id: string, courseId: string) {
    return enroll_student(this.dbService, id, courseId);
  }
}
