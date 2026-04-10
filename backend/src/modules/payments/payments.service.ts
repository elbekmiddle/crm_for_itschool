import { Injectable, OnModuleInit, Logger, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { all_payments } from './queries/all_payments';
import { list_debtor_students } from './queries/debtors';
import { get_student_payments_raw } from './queries/get_student_payments_raw';
import { create_payment } from './commands/create_payment';
import { TelegramService } from '../../infrastructure/notifications/telegram.service';
import { SocketsGateway } from '../sockets/sockets.gateway';

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly dbService: DbService,
    private readonly telegramService: TelegramService,
    private readonly socketsGateway: SocketsGateway,
  ) {}

  onModuleInit() {
    this.logger.log('Payment Cron initialized.');
    setInterval(() => this.checkOverduePayments(), 1000 * 60 * 60 * 24);
  }

  async checkOverduePayments() {
    this.logger.log('Checking overdue payments...');
    try {
      const students = await this.dbService.query(`SELECT id, first_name, telegram_chat_id FROM students WHERE deleted_at IS NULL`);
      for (const student of students) {
         if (!student.telegram_chat_id) continue;
         const data = await this.getStudentPayments(student.id);
         if (data.status === 'FROZEN' || data.status === 'PENDING') {
             await this.telegramService.notifyPaymentDue(student.telegram_chat_id, student.first_name, 500000, 'Joriy', student.id);
             await new Promise(r => setTimeout(r, 50));
         }
      }
    } catch (e) {
      this.logger.error('Overdue payments check failed:', e);
    }
  }

  async create(data: any) {
    let group_id = data.group_id;
    if (group_id === '' || group_id === undefined) {
      group_id = null;
    }
    if (!group_id && data.student_id) {
      const rows = await this.dbService.query(
        `SELECT gs.group_id FROM group_students gs
         INNER JOIN groups g ON g.id = gs.group_id
         WHERE gs.student_id = $1 AND gs.left_at IS NULL
         ORDER BY g.name ASC NULLS LAST
         LIMIT 1`,
        [data.student_id],
      );
      group_id = rows[0]?.group_id ?? null;
    }
    const row = await create_payment(this.dbService, { ...data, group_id });
    this.socketsGateway.emitDashboardRefresh({ source: 'payment', action: 'created' });
    return row;
  }

  async getStudentPayments(studentId: string) {
    const payments = await get_student_payments_raw(this.dbService, studentId);

    let status = 'ACTIVE';
    if (payments.length > 0) {
       const lastPaymentDate = new Date(payments[0].paid_at);
       const daysSince = Math.floor((new Date().getTime() - lastPaymentDate.getTime()) / (1000 * 3600 * 24));
       if (daysSince > 60) {
         status = 'FROZEN';
       }
    } else {
       status = 'PENDING';
    }

    return { status, payments };
  }

  async findAll() {
    return all_payments(this.dbService);
  }

  async listDebtors() {
    return list_debtor_students(this.dbService);
  }

  async updatePayment(id: string, data: {
    amount?: number;
    paid_at?: string;
    description?: string | null;
    student_id?: string;
  }) {
    const keys: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    if (data.amount != null) {
      keys.push(`amount = $${i++}`);
      vals.push(data.amount);
    }
    if (data.paid_at != null) {
      keys.push(`paid_at = $${i++}::timestamptz`);
      vals.push(data.paid_at);
    }
    if (data.description !== undefined) {
      keys.push(`description = $${i++}`);
      vals.push(data.description);
    }
    if (data.student_id !== undefined && data.student_id !== null && data.student_id !== '') {
      keys.push(`student_id = $${i++}::uuid`);
      vals.push(data.student_id);
    }
    if (!keys.length) {
      throw new BadRequestException("Yangilanadigan maydon yo'q");
    }
    vals.push(id);
    const q = `UPDATE payments SET ${keys.join(', ')} WHERE id = $${i} RETURNING *`;
    try {
      const rows = await this.dbService.query(q, vals);
      if (!rows?.length) {
        throw new NotFoundException("To'lov topilmadi");
      }
      this.socketsGateway.emitDashboardRefresh({ source: 'payment', action: 'updated' });
      return rows[0];
    } catch (e: any) {
      if (e?.status === 404) throw e;
      if (e?.code === '42703' && String(e?.message || '').includes('description')) {
        throw new BadRequestException("description ustuni bazada yo'q — migratsiyani tekshiring");
      }
      throw e;
    }
  }

  async remove(_id: string) {
    throw new ForbiddenException("To'lov yozuvlarini o'chirish taqiqlangan.");
  }
}

