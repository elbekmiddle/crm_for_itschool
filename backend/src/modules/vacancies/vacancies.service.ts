import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { TelegramService } from '../../infrastructure/notifications/telegram.service';

@Injectable()
export class VacanciesService {
   constructor(private db: DbService, private tg: TelegramService) {}

   async getVacancies() {
      return this.db.query('SELECT * FROM vacancies ORDER BY created_at DESC');
   }

   async createVacancy(data: any) {
      return this.db.query('INSERT INTO vacancies (title, description, salary) VALUES ($1, $2, $3) RETURNING *', [data.title, data.description, data.salary]);
   }

   async deleteVacancy(id: string) {
      return this.db.query('DELETE FROM vacancies WHERE id=$1', [id]);
   }

   async applyVacancy(data: any) {
      const { vacancy_id, name, phone, resume_url } = data;
      if (typeof resume_url === 'string' && resume_url.trim()) {
        try {
          const u = new URL(resume_url.trim());
          if (!['http:', 'https:'].includes(u.protocol)) {
            throw new BadRequestException('resume_url faqat http yoki https bo‘lishi kerak');
          }
        } catch (e: any) {
          if (e instanceof BadRequestException) throw e;
          throw new BadRequestException('resume_url noto‘g‘ri format');
        }
      }
      const res = await this.db.query(`
         INSERT INTO applications (vacancy_id, name, phone, resume_url) 
         VALUES ($1, $2, $3, $4) RETURNING *
      `, [vacancy_id, name, phone, resume_url]);

      const v = await this.db.query('SELECT title FROM vacancies WHERE id=$1', [vacancy_id]);
      const vTitle = v[0]?.title || '';

      const msg = `🧑‍💻 <b>Yangi Kadidat:</b>\n\nIsm: ${name}\nTel: ${phone}\nVakansiya: ${vTitle}\n\n<a href="${resume_url}">Rezyumeni ko'rish</a>`;
      await this.tg.notifyAdmin(msg);

      return res[0];
   }

   async getApplications() {
     return this.db.query('SELECT a.*, v.title as vacancy_title FROM applications a JOIN vacancies v ON a.vacancy_id=v.id ORDER BY a.created_at DESC');
   }
}
