import { Injectable } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { all_payments } from './queries/all_payments';
import { get_student_payments_raw } from './queries/get_student_payments_raw';
import { create_payment } from './commands/create_payment';
import { delete_payment } from './commands/delete_payment';

@Injectable()
export class PaymentsService {
  constructor(private readonly dbService: DbService) {}

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

