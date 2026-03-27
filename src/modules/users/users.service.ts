import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly dbService: DbService) {}

  async create(data: any) {
    const { email, password, role } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await this.dbService.query(
      `INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at`,
      [email, hashedPassword, role || 'TEACHER']
    );
    return result[0];
  }

  async findAll() {
    return this.dbService.query(`SELECT id, email, role, created_at FROM users WHERE deleted_at IS NULL`);
  }

  async findOne(id: string) {
    const result = await this.dbService.query(`SELECT id, email, role, created_at FROM users WHERE id = $1 AND deleted_at IS NULL`, [id]);
    if (!result.length) throw new NotFoundException('User not found');
    return result[0];
  }

  async softDelete(id: string) {
    const result = await this.dbService.query(
      `UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id]
    );
    if (!result.length) throw new NotFoundException('User not found');
    return { success: true };
  }
}
