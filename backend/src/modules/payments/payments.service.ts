import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { all_payments } from './queries/all_payments';
import { get_student_payments_raw } from './queries/get_student_payments_raw';
import { create_payment } from './commands/create_payment';
import { delete_payment } from './commands/delete_payment';
import { TelegramService } from '../../infrastructure/notifications/telegram.service';

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly dbService: DbService,
    private readonly telegramService: TelegramService
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
    return create_payment(this.dbService, data);
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

  async remove(id: string) {
    return delete_payment(this.dbService, id);
  }
}

