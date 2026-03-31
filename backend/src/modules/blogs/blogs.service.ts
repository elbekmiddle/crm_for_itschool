import { Injectable } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';

@Injectable()
export class BlogsService {
  constructor(private db: DbService) {}

  async create(data: any, userId: string) {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const res = await this.db.query(`
      INSERT INTO blogs (title, slug, content, image_url, category, created_by)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [data.title, slug, data.content, data.image_url, data.category, userId]);
    return res[0];
  }

  async findAll() {
    return this.db.query(`
      SELECT b.*, u.first_name as author_name 
      FROM blogs b 
      LEFT JOIN users u ON b.created_by = u.id 
      ORDER BY b.created_at DESC
    `);
  }

  async findOne(slug: string) {
    await this.db.query('UPDATE blogs SET views_count = views_count + 1 WHERE slug=$1', [slug]);
    const b = await this.db.query('SELECT b.*, u.first_name as author_name FROM blogs b LEFT JOIN users u ON b.created_by=u.id WHERE b.slug=$1', [slug]);
    return b[0];
  }

  async delete(id: string) {
    return this.db.query('DELETE FROM blogs WHERE id=$1', [id]);
  }
}
