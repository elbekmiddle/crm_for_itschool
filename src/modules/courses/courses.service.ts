import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';

@Injectable()
export class CoursesService {
  constructor(private readonly dbService: DbService) {}

  async create(data: any) {
    const { name, price } = data;
    const result = await this.dbService.query(
      `INSERT INTO courses (name, price) VALUES ($1, $2) RETURNING *`,
      [name, price]
    );
    return result[0];
  }

  async findAll() {
    return this.dbService.query(`SELECT * FROM courses ORDER BY created_at DESC`);
  }

  async findOne(id: string) {
    const result = await this.dbService.query(`SELECT * FROM courses WHERE id = $1`, [id]);
    if (!result.length) throw new NotFoundException('Course not found');
    return result[0];
  }
}
