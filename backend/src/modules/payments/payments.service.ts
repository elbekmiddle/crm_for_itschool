import { Injectable, Logger, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DbService } from '../../infrastructure/database/db.service';
import { all_payments } from './queries/all_payments';
import { all_payments_page, count_payments } from './queries/all_payments_paginated';
import { list_debtor_students } from './queries/debtors';
import { get_student_payments_raw } from './queries/get_student_payments_raw';
import { create_payment } from './commands/create_payment';
import { TelegramService } from '../../infrastructure/notifications/telegram.service';
import { SocketsGateway } from '../sockets/sockets.gateway';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly dbService: DbService,
    private readonly telegramService: TelegramService,
    private readonly socketsGateway: SocketsGateway,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkOverduePayments() {
    this.logger.log('Checking overdue payments...');
    try {
      /** Bitta so‘rov: oxirgi to‘langan sana (paid_at) bo‘yicha FROZEN/PENDING — N+1 yo‘q */
      const rows = await this.dbService.query(
        `
        WITH pc AS (
          SELECT student_id, COUNT(*)::int AS n,
            MAX(paid_at) FILTER (WHERE paid_at IS NOT NULL) AS last_paid
          FROM payments
          GROUP BY student_id
        )
        SELECT s.id, s.first_name, s.telegram_chat_id,
          COALESCE(
            (
              SELECT sc.price_agreed::numeric
              FROM student_courses sc
              WHERE sc.student_id = s.id AND sc.status = 'active'
              ORDER BY sc.created_at DESC NULLS LAST
              LIMIT 1
            ),
            0
          ) AS due_amount
        FROM students s
        LEFT JOIN pc ON pc.student_id = s.id
        WHERE s.deleted_at IS NULL
          AND s.telegram_chat_id IS NOT NULL
          AND (
            COALESCE(pc.n, 0) = 0
            OR pc.last_paid IS NULL
            OR pc.last_paid < NOW() - INTERVAL '60 days'
          )
        `,
      );
      for (const student of rows) {
        const amt = Math.max(0, Number(student.due_amount) || 0);
        await this.telegramService.notifyPaymentDue(
          student.telegram_chat_id,
          student.first_name,
          amt,
          'Joriy',
          student.id,
        );
        await new Promise((r) => setTimeout(r, 50));
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
      const lastWithPaidAt = payments.find((p: { paid_at?: string | null }) => p.paid_at != null);
      if (!lastWithPaidAt?.paid_at) {
        status = 'PENDING';
      } else {
        const lastPaymentDate = new Date(lastWithPaidAt.paid_at);
        const daysSince = Math.floor((new Date().getTime() - lastPaymentDate.getTime()) / (1000 * 3600 * 24));
        if (daysSince > 60) {
          status = 'FROZEN';
        }
      }
    } else {
      status = 'PENDING';
    }

    return { status, payments };
  }

  async findAll() {
    return all_payments(this.dbService);
  }

  /** CRM ro‘yxat: sahifalash — butun jadvalni RAM ga yuklamaydi */
  async findAllPaged(page: number, limit: number) {
    const safeLimit = Math.min(100, Math.max(1, limit));
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;
    const [items, total] = await Promise.all([
      all_payments_page(this.dbService, safeLimit, offset),
      count_payments(this.dbService),
    ]);
    return { items, total, page: safePage, limit: safeLimit };
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

