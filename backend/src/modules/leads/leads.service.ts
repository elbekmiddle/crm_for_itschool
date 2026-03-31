import { Injectable, BadRequestException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { TelegramService } from '../../infrastructure/notifications/telegram.service';
import { SocketsGateway } from '../sockets/sockets.gateway';

@Injectable()
export class LeadsService {
  constructor(
    private dbService: DbService,
    private telegramService: TelegramService,
    private socketsGateway: SocketsGateway
  ) {}

  async createLead(data: any) {
    if (!data.phone) throw new BadRequestException('Phone is required');
    const existing = await this.dbService.query(`SELECT * FROM leads WHERE phone=$1`, [data.phone]);
    if (existing.length) throw new BadRequestException('Bu raqamdan avval ariza tushgan.');

    const res = await this.dbService.query(`
      INSERT INTO leads (first_name, last_name, phone, parent_name, course_id, source)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [data.first_name, data.last_name || null, data.phone, data.parent_name || null, data.course_id || null, data.source || 'site']);

    // Emit realtime event
    this.socketsGateway.emitToAll('new_lead', res[0]);

    // Notify Manager
    const msg = `🆕 <b>Yangi Ariza tushdi!</b>\n\n👤 Talaba: ${data.first_name} ${data.last_name || ''}\n📞 Tel: ${data.phone}\nManba: ${data.source || 'Sayt'}`;
    await this.telegramService.notifyAdmin(msg);

    return res[0];
  }

  async findAll() {
    return this.dbService.query(`
      SELECT l.*, c.name as course_name 
      FROM leads l 
      LEFT JOIN courses c ON l.course_id = c.id
      ORDER BY l.created_at DESC
    `);
  }

  async convertLead(id: string, branchId: string = null) {
    const lead = await this.dbService.query(`SELECT * FROM leads WHERE id=$1`, [id]);
    if (!lead.length) throw new BadRequestException('Lead not found');

    const l = lead[0];
    const password = '123';

    // 1. Transaction to create user, student profile, course access
    try {
       await this.dbService.query('BEGIN');
       
       const user = await this.dbService.query(`
         INSERT INTO users (phone, password, role, first_name, last_name, branch_id)
         VALUES ($1, $2, 'STUDENT', $3, $4, $5) RETURNING id
       `, [l.phone, password, l.first_name, l.last_name, branchId]);

       const userId = user[0].id;

       await this.dbService.query(`
         INSERT INTO students (id, first_name, last_name, parent_name, phone)
         VALUES ($1, $2, $3, $4, $5)
       `, [userId, l.first_name, l.last_name, l.parent_name, l.phone]);

       if (l.course_id) {
         await this.dbService.query(`
           INSERT INTO student_courses (student_id, course_id, price_agreed)
           VALUES ($1, $2, 0)
         `, [userId, l.course_id]);
       }

       await this.dbService.query(`UPDATE leads SET status='converted' WHERE id=$1`, [id]);
       await this.dbService.query('COMMIT');
       
       return { success: true, message: "Talaba ro'yxatga olindi", userId };
    } catch (e) {
       await this.dbService.query('ROLLBACK');
       throw new BadRequestException("Talabani qo'shishda xatolik: " + e.message);
    }
  }

  async delete(id: String) {
    return this.dbService.query(`DELETE FROM leads WHERE id=$1`, [id]);
  }
}
