import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';

/**
 * Ensures critical columns/tables exist so API queries stop failing on older DBs.
 * Safe to run on every startup (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
 */
@Injectable()
export class SchemaBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(SchemaBootstrapService.name);

  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async onModuleInit() {
    await this.run();
  }

  private async execIgnore(sql: string, label: string) {
    try {
      await this.pool.query(sql);
    } catch (e: any) {
      this.logger.warn(`${label}: ${e?.message || e}`);
    }
  }

  async run() {
    const statements: { sql: string; label: string }[] = [
      { label: 'pgcrypto', sql: `CREATE EXTENSION IF NOT EXISTS pgcrypto` },
      {
        label: 'users columns',
        sql: `
          ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed_pct INTEGER DEFAULT 0;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id UUID;
        `,
      },
      {
        label: 'courses.deleted_at',
        sql: `ALTER TABLE courses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`,
      },
      {
        label: 'courses meta + teacher',
        sql: `
          ALTER TABLE courses ADD COLUMN IF NOT EXISTS description TEXT;
          ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_months INTEGER;
          ALTER TABLE courses ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;
        `,
      },
      {
        label: 'groups.deleted_at',
        sql: `ALTER TABLE groups ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`,
      },
      {
        label: 'groups.schedule',
        sql: `ALTER TABLE groups ADD COLUMN IF NOT EXISTS schedule TEXT`,
      },
      {
        label: 'group_students.left_at',
        sql: `ALTER TABLE group_students ADD COLUMN IF NOT EXISTS left_at TIMESTAMP`,
      },
      {
        label: 'group_students.joined_at',
        sql: `ALTER TABLE group_students ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      },
      {
        label: 'students columns',
        sql: `
          ALTER TABLE students ADD COLUMN IF NOT EXISTS email TEXT;
          ALTER TABLE students ADD COLUMN IF NOT EXISTS status TEXT;
          ALTER TABLE students ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
          ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
          ALTER TABLE students ADD COLUMN IF NOT EXISTS telegram_username TEXT;
        `,
      },
      {
        label: 'payments.status',
        sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed'`,
      },
      {
        label: 'payments extra',
        sql: `
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS description TEXT;
        `,
      },
      {
        label: 'audit_logs',
        sql: `
          CREATE TABLE IF NOT EXISTS audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID,
            action TEXT,
            entity TEXT,
            ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `,
      },
      {
        label: 'student_courses',
        sql: `
          CREATE TABLE IF NOT EXISTS student_courses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            status TEXT NOT NULL DEFAULT 'active',
            price_agreed NUMERIC DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, course_id)
          );
        `,
      },
      {
        label: 'student_courses started_at / ended_at',
        sql: `
          ALTER TABLE student_courses ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
          ALTER TABLE student_courses ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP;
        `,
      },
      {
        label: 'leads',
        sql: `
          CREATE TABLE IF NOT EXISTS leads (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            first_name TEXT,
            last_name TEXT,
            phone TEXT NOT NULL,
            parent_name TEXT,
            course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
            source TEXT DEFAULT 'site',
            status TEXT DEFAULT 'new',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `,
      },
      {
        label: 'exams.deleted_at + group_id',
        sql: `
          ALTER TABLE exams ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
          ALTER TABLE exams ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;
          CREATE INDEX IF NOT EXISTS idx_exams_group_id ON exams(group_id) WHERE group_id IS NOT NULL;
        `,
      },
      {
        label: 'exams.time_limit (duration_minutes bilan sinxron)',
        sql: `
          ALTER TABLE exams ADD COLUMN IF NOT EXISTS time_limit INTEGER;
          UPDATE exams SET time_limit = COALESCE(time_limit, duration_minutes, 60) WHERE time_limit IS NULL;
        `,
      },
      {
        label: 'exam_attempts deadline / finished / score',
        sql: `
          ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMP;
          ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP;
          ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS score NUMERIC(5,2);
        `,
      },
      {
        label: 'exam_results.submitted_at',
        sql: `
          ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
          UPDATE exam_results SET submitted_at = COALESCE(submitted_at, created_at) WHERE submitted_at IS NULL;
        `,
      },
      {
        label: 'payments.course_id',
        sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL`,
      },
      {
        label: 'blogs',
        sql: `
          CREATE TABLE IF NOT EXISTS blogs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            content TEXT,
            image_url TEXT,
            category TEXT,
            status TEXT DEFAULT 'draft',
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            views_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `,
      },
    ];

    for (const { sql, label } of statements) {
      await this.execIgnore(sql, label);
    }

    this.logger.log('Schema bootstrap finished.');
  }
}
