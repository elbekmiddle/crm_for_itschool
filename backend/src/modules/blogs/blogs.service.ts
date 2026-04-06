import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';

@Injectable()
export class BlogsService {
  constructor(private db: DbService) {}

  async create(data: any, userId: string) {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '') + '-' + Date.now();
    // Check if status column exists, fallback gracefully
    try {
      const res = await this.db.query(`
        INSERT INTO blogs (title, slug, content, image_url, category, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
      `, [data.title, slug, data.content, data.image_url || null, data.category || null, data.status || 'draft', userId]);
      return res[0];
    } catch (e: any) {
      // If status column doesn't exist, insert without it
      if (e.message?.includes('column "status"')) {
        const res = await this.db.query(`
          INSERT INTO blogs (title, slug, content, image_url, category, created_by)
          VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `, [data.title, slug, data.content, data.image_url || null, data.category || null, userId]);
        return res[0];
      }
      throw e;
    }
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
    if (!b[0]) throw new NotFoundException('Blog topilmadi');
    return b[0];
  }

  async update(id: string, data: any) {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (data.title) {
      const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '') + '-' + Date.now();
      fields.push(`slug = $${i++}`);
      values.push(slug);
    }

    for (const [key, value] of Object.entries(data)) {
      if (key === 'status') continue; // Skip status if column might not exist
      fields.push(`${key} = $${i++}`);
      values.push(value);
    }

    if (fields.length === 0) return { message: 'Nothing to update' };

    values.push(id);
    const res = await this.db.query(`
      UPDATE blogs SET ${fields.join(', ')} WHERE id = $${i} RETURNING *
    `, values);
    return res[0];
  }

  async delete(id: string) {
    return this.db.query('DELETE FROM blogs WHERE id=$1', [id]);
  }
}
