import { Injectable } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly dbService: DbService) {}

  async create(data: any) {
    const { student_id, group_id, amount } = data;
    const result = await this.dbService.query(
      `INSERT INTO payments (student_id, group_id, amount) VALUES ($1, $2, $3) RETURNING *`,
      [student_id, group_id, amount]
    );
    return result[0];
  }

  async getStudentPayments(studentId: string) {
    const payments = await this.dbService.query(
      `SELECT * FROM payments WHERE student_id = $1 ORDER BY paid_at DESC`,
      [studentId]
    );

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
}
