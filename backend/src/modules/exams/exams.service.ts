import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { QueueService } from '../../infrastructure/queue/queue.service';
import { all_exams_by_course } from './queries/all_exams_by_course';
import { get_exam_results } from './queries/get_exam_results';
import { create_exam } from './commands/create_exam';
import { add_questions_to_exam } from './commands/add_questions_to_exam';
import { insertQuestionCompat } from './commands/insert_question_compat';
import * as dayjs from 'dayjs';

import { TelegramService } from '../../infrastructure/notifications/telegram.service';
import { SocketsGateway } from '../sockets/sockets.gateway';
import { AiService } from '../ai/ai.service';
@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(
    private readonly dbService: DbService, 
    private readonly queueService: QueueService,
    private readonly telegramService: TelegramService,
    private readonly socketsGateway: SocketsGateway,
    private readonly aiService: AiService,
  ) {}

  private buildExamListSql(filterDeleted: boolean, joinGroup: boolean, teacherId: string | null) {
    const parts: string[] = [];
    const params: any[] = [];
    if (filterDeleted) parts.push('e.deleted_at IS NULL');
    if (teacherId) {
      params.push(teacherId);
      parts.push(`e.created_by = $${params.length}`);
    }
    const where = parts.length ? `WHERE ${parts.join(' AND ')}` : '';
    const groupJoin = joinGroup ? 'LEFT JOIN groups eg ON eg.id = e.group_id' : '';
    const groupSelect = joinGroup ? ', eg.name AS group_name' : '';
    return {
      sql: `
      SELECT
        e.*,
        c.name AS course_name${groupSelect},
        (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) AS question_count,
        (SELECT ROUND(AVG(score)) FROM exam_results WHERE exam_id = e.id) AS avg_score
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      ${groupJoin}
      ${where}
      ORDER BY e.created_at DESC
    `,
      params,
    };
  }

  async findAll(user?: { id: string; role: string }) {
    const teacherId = user?.role === 'TEACHER' ? user.id : null;
    let lastErr: any;
    for (const joinGroup of [true, false]) {
      for (const filterDeleted of [true, false]) {
        try {
          const { sql, params } = this.buildExamListSql(filterDeleted, joinGroup, teacherId);
          return await this.dbService.query(sql, params);
        } catch (e: any) {
          lastErr = e;
          if (e?.code !== '42703') throw e;
        }
      }
    }
    throw lastErr;
  }

  async findOne(id: string) {
    let exam: any[];
    try {
      exam = await this.dbService.query(`
      SELECT e.*, c.name as course_name
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      WHERE e.id = $1 AND e.deleted_at IS NULL
    `, [id]);
    } catch (e: any) {
      if (e?.code !== '42703') throw e;
      exam = await this.dbService.query(`
      SELECT e.*, c.name as course_name
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      WHERE e.id = $1
    `, [id]);
    }
    if (!exam.length) throw new NotFoundException('Imtihon topilmadi');
    
    const questions = await this.dbService.query(
      `
      SELECT q.* 
      FROM questions q
      JOIN exam_questions eq ON q.id = eq.question_id
      WHERE eq.exam_id = $1
    `,
      [id],
    );

    const parseJson = (v: any, fb: any) => {
      if (v == null) return fb;
      if (typeof v === 'string') {
        try {
          return JSON.parse(v);
        } catch {
          return v;
        }
      }
      return v;
    };

    const normalized = questions.map((q: any) => ({
      ...q,
      options: parseJson(q.options, []),
      correct_answer: parseJson(q.correct_answer, q.correct_answer),
      type: String(q.type || 'multiple_choice').toLowerCase().replace(/-/g, '_'),
    }));

    let group_name: string | null = null;
    const gid = exam[0]?.group_id;
    if (gid) {
      const gr = await this.dbService.query(`SELECT name FROM groups WHERE id = $1`, [gid]);
      group_name = gr[0]?.name ?? null;
    }

    const row = exam[0];
    return {
      ...row,
      group_name,
      questions: normalized,
      duration: row.duration_minutes ?? row.duration ?? 60,
      questions_count: normalized.length,
    };
  }

  async create(createExamDto: CreateExamDto, teacherId: string, role?: string) {
    if (role === 'TEACHER' && !createExamDto.group_id?.trim()) {
      throw new BadRequestException(
        "Guruhni tanlang — nashr qilganda imtihon faqat shu guruh a'zolariga ko'rinadi.",
      );
    }
    const newExam = await create_exam(this.dbService, createExamDto, teacherId);
    this.socketsGateway.emitToAll('exam_created', newExam);
    this.socketsGateway.emitDashboardRefresh({ source: 'exam', action: 'created' });
    return newExam;
  }

  async update(id: string, data: any) {
    const { questions: _nestedQuestions, ...rest } = data || {};
    const keys = Object.keys(rest);
    if (!keys.length) {
      const one = await this.findOne(id);
      return one;
    }
    const prevStatusRows = await this.dbService.query(`SELECT status FROM exams WHERE id = $1`, [id]);
    const prevStatus = prevStatusRows[0]?.status as string | undefined;

    const fields = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = keys.map((k) => rest[k]);
    const result = await this.dbService.query(
      `UPDATE exams SET ${fields} WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    this.socketsGateway.emitToAll('exam_updated', result[0]);
    if (data.status === 'published' || data.status === 'approved') {
       this.socketsGateway.emitToAll('exam_approved', result[0]);
    }
    this.socketsGateway.emitDashboardRefresh({ source: 'exam', action: 'updated' });

    if (rest.status === 'published' && prevStatus !== 'published' && result[0]) {
      void this.notifyStudentsExamPublished(result[0]);
    }

    return result[0];
  }

  async publishExam(id: string, user: { id: string; role: string }) {
    if (user.role === 'TEACHER') {
      try {
        const rows = await this.dbService.query(
          `SELECT group_id, created_by FROM exams WHERE id = $1`,
          [id],
        );
        const row = rows[0];
        if (row && String(row.created_by) === String(user.id)) {
          if (row.group_id == null || row.group_id === '') {
            throw new BadRequestException(
              "Avval imtihonni tahrirlab guruhni bog'lang — faqat tanlangan guruh o'quvchilari ko'radi.",
            );
          }
        }
      } catch (e: any) {
        if (e instanceof BadRequestException) throw e;
        if (e?.code !== '42703') throw e;
        /* exams.group_id ustuni yo'q — eski sxema */
      }
    }
    return this.update(id, { status: 'published' });
  }

  async remove(id: string) {
    try {
      await this.dbService.query(`UPDATE exams SET deleted_at = NOW() WHERE id = $1`, [id]);
    } catch (e: any) {
      if (e?.code === '42703') {
        await this.dbService.query(`DELETE FROM exams WHERE id = $1`, [id]);
      } else {
        throw e;
      }
    }
    this.socketsGateway.emitDashboardRefresh({ source: 'exam', action: 'deleted' });
    return { success: true };
  }

  async addQuestionsToExam(examId: string, questionIds: string[]) {
    return add_questions_to_exam(this.dbService, examId, questionIds);
  }

  async addNewQuestion(examId: string, data: any) {
    const lessonId = data.lesson_id || null;
    const createdBy = data.teacherId || data.created_by;
    if (!createdBy) throw new BadRequestException('created_by (o‘qituvchi) kerak');

    const type = String(data.type || 'multiple_choice').replace(/-/g, '_');
    const correctRaw = data.correct_answer;
    const correctJson =
      correctRaw !== undefined && correctRaw !== null
        ? JSON.stringify(correctRaw)
        : JSON.stringify(type === 'multiple_select' ? [] : 0);

    const qid = await insertQuestionCompat(this.dbService, {
      lessonId,
      createdBy,
      level: data.level || 'medium',
      text: data.text || 'Yangi savol',
      optionsJson: JSON.stringify(data.options || []),
      correctJson,
      type,
    });

    await this.dbService.query(`INSERT INTO exam_questions (exam_id, question_id) VALUES ($1, $2)`, [
      examId,
      qid,
    ]);

    const rows = await this.dbService.query(`SELECT * FROM questions WHERE id = $1`, [qid]);
    this.socketsGateway.emitToAll('exam_updated', { examId });
    return rows[0];
  }

  async removeQuestionFromExam(examId: string, questionId: string) {
    return this.dbService.query(
      `DELETE FROM exam_questions WHERE exam_id = $1 AND question_id = $2`,
      [examId, questionId]
    );
  }

  async updateQuestion(examId: string, questionId: string, data: any) {
    const row: Record<string, any> = { ...data };
    delete row.id;
    delete row.teacherId;
    delete row.created_by;
    if (row.options !== undefined && typeof row.options !== 'string') {
      row.options = JSON.stringify(row.options ?? []);
    }
    if (
      row.correct_answer !== undefined &&
      row.correct_answer !== null &&
      typeof row.correct_answer !== 'string'
    ) {
      row.correct_answer = JSON.stringify(row.correct_answer);
    }
    const keys = Object.keys(row).filter((k) => row[k] !== undefined);
    if (!keys.length) {
      const existing = await this.dbService.query(`SELECT * FROM questions WHERE id = $1`, [questionId]);
      return existing[0];
    }
    const fields = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = keys.map((k) => row[k]);
    const result = await this.dbService.query(
      `UPDATE questions SET ${fields} WHERE id = $1 RETURNING *`,
      [questionId, ...values],
    );
    this.socketsGateway.emitToAll('exam_updated', { examId });
    return result[0];
  }

  async approveAllQuestions(examId: string) {
    const exam = await this.dbService.query(`SELECT id FROM exams WHERE id = $1`, [examId]);
    if (!exam.length) throw new NotFoundException('Imtihon topilmadi');

    try {
      await this.dbService.query(
        `
      UPDATE questions 
      SET status = 'approved' 
      WHERE id IN (SELECT question_id FROM exam_questions WHERE exam_id = $1)
      AND status = 'draft'
    `,
        [examId],
      );
    } catch (e: any) {
      if (e?.code !== '42703') throw e;
      /* questions.status ustuni yo'q — imtihonni baribir e'lon qilamiz */
    }

    // Update exam status if it was pending
    await this.dbService.query(`UPDATE exams SET status = 'published' WHERE id = $1`, [examId]);

    this.socketsGateway.emitToAll('exam_approved', { examId });
    return { success: true, message: 'Barcha savollar tasdiqlandi va imtihon e\'lon qilindi' };
  }

  async generateAiExam(examId: string, lessonId: string, topic: string, level: string, count: number, teacherId: string) {
    let exam: any[];
    try {
      exam = await this.dbService.query(
        `SELECT e.id, e.title, e.created_by, e.group_id, c.name AS course_name
         FROM exams e
         JOIN courses c ON c.id = e.course_id
         WHERE e.id = $1`,
        [examId],
      );
    } catch (e: any) {
      if (e?.code !== '42703') throw e;
      exam = await this.dbService.query(
        `SELECT e.id, e.title, e.created_by, c.name AS course_name
         FROM exams e
         JOIN courses c ON c.id = e.course_id
         WHERE e.id = $1`,
        [examId],
      );
    }
    if (!exam.length) throw new NotFoundException('Exam not found');

    const title = (exam[0].title || '').trim();
    const courseName = (exam[0].course_name || '').trim();
    const topicTrim = (topic || '').trim();

    let groupHint = '';
    let lessonTopicsHint = '';
    const gid = exam[0]?.group_id;
    if (gid) {
      try {
        const gr = await this.dbService.query(
          `SELECT g.name, g.schedule, c.name AS cn
           FROM groups g
           JOIN courses c ON c.id = g.course_id
           WHERE g.id = $1`,
          [gid],
        );
        if (gr.length) {
          const gn = (gr[0].name || '').trim();
          const cn = (gr[0].cn || '').trim();
          const sch = (gr[0].schedule || '').trim();
          groupHint =
            `Guruh: ${gn || '—'}. Kurs: ${cn || '—'}. ` + (sch ? `O‘tiladigan blok / jadval: ${sch}. ` : '');
        }
        const logs = await this.dbService.query(
          `SELECT topic FROM group_lesson_log
           WHERE group_id = $1 AND topic IS NOT NULL AND TRIM(topic) <> ''
           ORDER BY lesson_date DESC
           LIMIT 20`,
          [gid],
        );
        const topics = (logs || [])
          .map((r: { topic?: string }) => String(r.topic || '').trim())
          .filter(Boolean);
        if (topics.length) {
          const uniq = [...new Set(topics)].slice(0, 12);
          lessonTopicsHint = ` Darslarda o‘tilgan mavzular (davomat/mavzu jurnali): ${uniq.join('; ')}.`;
        }
      } catch {
        /* non-blocking */
      }
    }

    const effectiveTopic =
      topicTrim ||
      `${groupHint}${lessonTopicsHint}${[title, courseName ? `(${courseName})` : ''].filter(Boolean).join(' ').trim()}`.trim() ||
      'Umumiy akademik savollar';

    let job: { id?: string } | null;
    try {
      job = await this.queueService.addExamJob({
        examId,
        lessonId,
        topic: effectiveTopic,
        level: level as any,
        count,
        teacherId,
      });
    } catch (e: any) {
      throw new BadRequestException(
        e?.message ||
          "AI imtihon yaratilmadi: OpenAI kvota/kalit, tarmoq yoki ma'lumotlar bazasi xatosi.",
      );
    }

    if (!job?.id) {
      throw new BadRequestException(
        "AI navbat ishga tushmadi: Redis (REDIS_URL) yoki queue sozlamalarini tekshiring.",
      );
    }

    // Notify teacher via Telegram that AI is working (or check socket room)
    const teacher = await this.dbService.query(`SELECT telegram_chat_id FROM users WHERE id = $1`, [teacherId]);
    if (teacher[0]?.telegram_chat_id) {
       await this.telegramService.sendMessage(
         `⚙️ <b>AI Imtihon yaratishni boshladi...</b>\n\n📌 <b>${exam[0].title}</b> uchun savollar tayyorlanmoqda. Yakunlangach xabar beramiz.`,
         teacher[0].telegram_chat_id
       );
    }

    return { success: true, message: 'AI generation started', jobId: job?.id };
  }

  // --- Student Logic ---

  async getAvailableExams(studentId: string) {
    try {
      const build = (deletedFilter: string, groupScoped: boolean, durationExpr: string) => {
      const scope = groupScoped
        ? 'AND (e.group_id IS NULL OR e.group_id = gx.id)'
        : '';
      return `
      SELECT
        e.*,
        c.name as course_name,
        ${durationExpr} as duration,
        (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) as questions_count,
        (SELECT ea.status FROM exam_attempts ea
         WHERE ea.exam_id = e.id AND ea.student_id = $1
         ORDER BY ea.started_at DESC NULLS LAST LIMIT 1) as attempt_status,
        (SELECT er.score FROM exam_results er
         WHERE er.exam_id = e.id AND er.student_id = $1
         ORDER BY er.created_at DESC NULLS LAST LIMIT 1) as score,
        CASE
          WHEN (SELECT ea.status FROM exam_attempts ea WHERE ea.exam_id = e.id AND ea.student_id = $1 ORDER BY ea.started_at DESC NULLS LAST LIMIT 1) IN ('submitted', 'graded') THEN 'COMPLETED'
          WHEN (SELECT ea.status FROM exam_attempts ea WHERE ea.exam_id = e.id AND ea.student_id = $1 ORDER BY ea.started_at DESC NULLS LAST LIMIT 1) = 'in_progress' THEN 'IN_PROGRESS'
          ELSE 'UPCOMING'
        END as status
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      WHERE e.status = 'published'
      ${deletedFilter}
      AND EXISTS (
        SELECT 1 FROM groups gx
        INNER JOIN group_students gs ON gs.group_id = gx.id AND gs.student_id = $1
        WHERE gx.course_id = e.course_id
        ${scope}
      )
    `;
      };

      const durationVariants = [
        'COALESCE(e.time_limit, e.duration_minutes, 60)',
        'COALESCE(e.duration_minutes, 60)',
      ];
      let lastErr: any;
      for (const groupScoped of [true, false]) {
        for (const deletedPart of ['AND e.deleted_at IS NULL', '']) {
          for (const dur of durationVariants) {
            try {
              return await this.dbService.query(build(deletedPart, groupScoped, dur), [studentId]);
            } catch (e: any) {
              lastErr = e;
              if (e?.code !== '42703') throw e;
            }
          }
        }
      }
      // Barcha urinishlar 42703 (ustun yo‘q) bilan yiqilgan bo‘lsa, 503 o‘rniga bo‘sh ro‘yxat
      if (lastErr?.code === '42703' || lastErr?.code === '42P01') {
        return [];
      }
      throw lastErr;
    } catch (e: any) {
      if (e?.code === '42P01' || e?.code === '42703') return [];
      throw e;
    }
  }

  async startExamAttempt(examId: string, studentUserId: string) {
    const studentId = studentUserId;
    let exam: any[];
    try {
      exam = await this.dbService.query(
        `SELECT e.id, COALESCE(e.time_limit, e.duration_minutes, 60) AS time_limit FROM exams e
         WHERE e.id = $1 AND e.status = 'published'
         AND EXISTS (
           SELECT 1 FROM groups gx
           INNER JOIN group_students gs ON gs.group_id = gx.id AND gs.student_id = $2
           WHERE gx.course_id = e.course_id
           AND (e.group_id IS NULL OR e.group_id = gx.id)
         )`,
        [examId, studentId],
      );
    } catch (e: any) {
      if (e?.code !== '42703') throw e;
      try {
        exam = await this.dbService.query(
          `SELECT e.id, COALESCE(e.duration_minutes, 60) AS time_limit FROM exams e
           WHERE e.id = $1 AND e.status = 'published'
           AND EXISTS (
             SELECT 1 FROM groups gx
             INNER JOIN group_students gs ON gs.group_id = gx.id AND gs.student_id = $2
             WHERE gx.course_id = e.course_id
             AND (e.group_id IS NULL OR e.group_id = gx.id)
           )`,
          [examId, studentId],
        );
      } catch (e2: any) {
        if (e2?.code !== '42703') throw e2;
        exam = await this.dbService.query(
          `SELECT e.id, COALESCE(e.duration_minutes, 60) AS time_limit FROM exams e
           WHERE e.id = $1 AND e.status = 'published'
           AND EXISTS (
             SELECT 1 FROM groups gx
             INNER JOIN group_students gs ON gs.group_id = gx.id AND gs.student_id = $2
             WHERE gx.course_id = e.course_id
           )`,
          [examId, studentId],
        );
      }
    }
    if (!exam.length) {
      throw new NotFoundException(
        "Imtihon topilmadi, nashr qilinmagan yoki sizga biriktirilgan guruh uchun emas.",
      );
    }

    // 1. req.user.id for students matches students.id (studentId above)

    // 2. Check for active attempt
    const activeAttempt = await this.dbService.query(`
      SELECT * FROM exam_attempts 
      WHERE exam_id = $1 AND student_id = $2 AND status = 'in_progress'
    `, [examId, studentId]);

    if (activeAttempt.length) {
      // Check if time is up
      if (dayjs().isAfter(dayjs(activeAttempt[0].deadline_at))) {
        await this.finishAttempt(activeAttempt[0].id);
        throw new BadRequestException('Exam time limit exceeded. Session closed.');
      }
      return activeAttempt[0];
    }

    // 3. Create new attempt
    const deadline = dayjs().add(exam[0].time_limit, 'minute').toDate();
    const result = await this.dbService.query(`
      INSERT INTO exam_attempts (exam_id, student_id, deadline_at) 
      VALUES ($1, $2, $3) RETURNING *
    `, [examId, studentId, deadline]);

    try {
      const student = await this.dbService.query(`SELECT first_name FROM students WHERE id = $1`, [studentId]);
      this.socketsGateway.emitToAll('exam_started', { examId, studentId, studentName: student[0]?.first_name });
      const examObj = await this.dbService.query(`SELECT title FROM exams WHERE id = $1`, [examId]);
      
      // Attempt to notify Telegram if student has it
      const studentData = await this.dbService.query(`SELECT telegram_chat_id FROM students WHERE id = $1`, [studentId]);
      if (studentData[0]?.telegram_chat_id) {
          await this.telegramService.notifyExamStarting(studentData[0].telegram_chat_id, student[0]?.first_name, examObj[0]?.title, studentId);
      }
    } catch (e) {}

    return result[0];
  }

  async getAttemptQuestions(attemptId: string) {
    const attempt = await this.dbService.query(`SELECT exam_id FROM exam_attempts WHERE id = $1`, [attemptId]);
    if (!attempt.length) throw new NotFoundException('Attempt not found.');

    /** Tartibni imtihon savollari bilan moslashtiramiz (random tartib to‘g‘ri javob bilan chalkashmasin). */
    let questions: any[];
    try {
      questions = await this.dbService.query(
        `
      SELECT q.id, q.text, q.options, q.level, q.type
      FROM questions q
      JOIN exam_questions eq ON eq.question_id = q.id
      WHERE eq.exam_id = $1
      ORDER BY COALESCE(eq.question_order, 2147483647), eq.created_at ASC NULLS LAST, q.id
    `,
        [attempt[0].exam_id],
      );
    } catch (e: any) {
      if (e?.code !== '42703') throw e;
      questions = await this.dbService.query(
        `
      SELECT q.id, q.text, q.options, q.level, q.type
      FROM questions q
      JOIN exam_questions eq ON eq.question_id = q.id
      WHERE eq.exam_id = $1
      ORDER BY eq.created_at ASC NULLS LAST, q.id
    `,
        [attempt[0].exam_id],
      );
    }

    const parseJson = (v: any, fb: any) => {
      if (v == null) return fb;
      if (typeof v === 'string') {
        try {
          return JSON.parse(v);
        } catch {
          return v;
        }
      }
      return v;
    };

    const normalizeOptions = (raw: any): Array<{ id: string; text: string }> => {
      const p = parseJson(raw, []);
      if (Array.isArray(p)) {
        return p.map((opt: any, i: number) => {
          if (opt != null && typeof opt === 'object') {
            return {
              id: String(opt.id ?? opt.value ?? i + 1),
              text: String(opt.text ?? opt.label ?? opt.value ?? ''),
            };
          }
          return { id: String(i + 1), text: String(opt) };
        });
      }
      if (p && typeof p === 'object') {
        return Object.entries(p).map(([id, text]) => ({
          id: String(id),
          text: String(text),
        }));
      }
      return [];
    };

    return questions.map((q: any) => {
      let t = String(q.type || 'multiple_choice')
        .toLowerCase()
        .replace(/-/g, '_');
      if (['select', 'mcq', 'single_choice', 'radio'].includes(t)) t = 'multiple_choice';
      if (['boolean', 'tf', 'true_false', 'yes_no'].includes(t)) t = 'true_false';
      if (['multiple_select'].includes(t)) t = 'multi_select';

      let options = normalizeOptions(q.options);

      if (t === 'true_false' && options.length < 2) {
        options = [
          { id: '1', text: "To'g'ri" },
          { id: '2', text: "Noto'g'ri" },
        ];
        t = 'multiple_choice';
      }

      if (options.length >= 2 && ['text', 'short_answer', 'essay', 'open'].includes(t)) {
        t = 'multiple_choice';
      }

      return {
        ...q,
        type: t,
        options,
      };
    });
  }

  async getAttemptAnswers(attemptId: string) {
    const parseCell = (v: any) => {
      if (v == null) return null;
      if (typeof v === 'object') return v;
      if (typeof v === 'string') {
        try {
          return JSON.parse(v);
        } catch {
          return v;
        }
      }
      return v;
    };

    const sqlVariants = [
      `SELECT question_id, answer AS ap FROM attempt_answers WHERE attempt_id = $1`,
      `SELECT question_id, answer_payload AS ap FROM attempt_answers WHERE attempt_id = $1`,
    ];

    let lastErr: any;
    for (const sql of sqlVariants) {
      try {
        const answers = await this.dbService.query(sql, [attemptId]);
        return answers.reduce((acc: Record<string, any>, curr: any) => {
          acc[curr.question_id] = parseCell(curr.ap);
          return acc;
        }, {});
      } catch (e: any) {
        lastErr = e;
        if (e?.code !== '42703') throw e;
      }
    }
    this.logger.warn(`getAttemptAnswers: ${lastErr?.message || 'fallback empty'}`);
    return {};
  }

  async getActiveAttempt(examId: string, studentId: string) {
    const active = await this.dbService.query(`
      SELECT * FROM exam_attempts
      WHERE exam_id = $1 AND student_id = $2 AND status = 'in_progress'
      ORDER BY started_at DESC LIMIT 1
    `, [examId, studentId]);

    return active[0] || null;
  }

  async saveAnswer(attemptId: string, questionId: string, payload: any, clientTime?: number) {
    const attempt = await this.dbService.query(`SELECT status FROM exam_attempts WHERE id = $1`, [attemptId]);
    if (attempt[0].status !== 'in_progress') throw new ConflictException('Exam session is not active.');

    if (clientTime) {
      const serverTime = Date.now();
      if (clientTime > serverTime + 300000) { // 5 minutes
        throw new ForbiddenException("Time manipulation detected");
      }
    }

    const payloadStr = JSON.stringify(payload ?? null);
    const attempts = [
      `
      INSERT INTO attempt_answers (attempt_id, question_id, answer)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (attempt_id, question_id) DO UPDATE
      SET answer = EXCLUDED.answer, answered_at = NOW()
    `,
      `
      INSERT INTO attempt_answers (attempt_id, question_id, answer_payload)
      VALUES ($1, $2, $3)
      ON CONFLICT (attempt_id, question_id) DO UPDATE
      SET answer_payload = EXCLUDED.answer_payload, answered_at = NOW()
    `,
    ];

    let last: any;
    for (const sql of attempts) {
      try {
        return await this.dbService.query(sql, [attemptId, questionId, payloadStr]);
      } catch (e: any) {
        last = e;
        if (e?.code !== '42703') throw e;
      }
    }
    throw last;
  }

  async submitExamAttempt(attemptId: string) {
    return this.finishAttempt(attemptId);
  }

  private async finishAttempt(attemptId: string) {
    const attempt = await this.dbService.query(`SELECT exam_id, student_id FROM exam_attempts WHERE id = $1`, [attemptId]);
    if (!attempt.length) throw new NotFoundException('Attempt not found.');

    const { exam_id, student_id } = attempt[0];

    // Calculate score
    const answers = await this.dbService.query(`
      SELECT aa.*, q.correct_answer, q.id as question_id
      FROM attempt_answers aa
      JOIN questions q ON aa.question_id = q.id
      WHERE aa.attempt_id = $1
    `, [attemptId]);

    const totalQuestions = await this.dbService.query(`SELECT count(*) FROM exam_questions WHERE exam_id = $1`, [exam_id]);
    const totalCount = parseInt(totalQuestions[0].count) || 0;

    let correctCount = 0;
    
    for (const ans of answers) {
       const question = await this.dbService.query(
         `SELECT type, correct_answer, text FROM questions WHERE id = $1`,
         [ans.question_id],
       );
       if (!question.length) continue;
       
       let isCorrect = false;
       let points = 0;
       let qType = String(question[0].type || '')
         .toLowerCase()
         .replace(/-/g, '_');
       if (qType === 'select' || qType === 'mcq') qType = 'multiple_choice';
       if (qType === 'boolean' || qType === 'tf') qType = 'true_false';

       const unwrapPayloadCell = (raw: any) => {
         if (raw == null || raw === '') return null;
         if (typeof raw === 'object') return raw;
         if (typeof raw === 'string') {
           try {
             return JSON.parse(raw);
           } catch {
             return raw;
           }
         }
         return raw;
       };
       const unwrapCorrect = (v: any) => {
         if (v == null) return null;
         if (typeof v === 'string') {
           try {
             return JSON.parse(v);
           } catch {
             return v;
           }
         }
         return v;
       };

       const qCorrectRaw = unwrapCorrect(question[0].correct_answer);
       const qText = String(question[0].text || '');
       const rawAns =
         ans.answer_payload != null && ans.answer_payload !== ''
           ? ans.answer_payload
           : ans.answer;
       const uPayload = unwrapPayloadCell(rawAns);
       const refStr =
         typeof qCorrectRaw === 'string' || typeof qCorrectRaw === 'number'
           ? String(qCorrectRaw)
           : JSON.stringify(qCorrectRaw ?? '');

       const numEq = (a: any, b: any) => Number(a) === Number(b);

       // Enhanced AI evaluation
       if (qType === 'multiple_choice' || qType === 'true_false') {
         isCorrect =
           numEq(uPayload, qCorrectRaw) ||
           String(uPayload ?? '') === String(qCorrectRaw ?? '');
       } else if (qType === 'multi_select' || qType === 'multiple_select') {
         const pArr = (Array.isArray(uPayload) ? uPayload : []).map((x) => Number(x)).sort((a, b) => a - b);
         const cArr = (Array.isArray(qCorrectRaw) ? qCorrectRaw : []).map((x) => Number(x)).sort((a, b) => a - b);
         isCorrect =
           cArr.length > 0 &&
           pArr.length === cArr.length &&
           pArr.every((v, i) => v === cArr[i]);
       } else if (qType === 'text') {
         const aiGr = await this.aiService.gradeExamAnswer({
           questionText: qText,
           expectedAnswer: refStr,
           studentAnswer: String(uPayload ?? ''),
           questionType: 'text',
         });
         if (aiGr) {
           isCorrect = aiGr.isCorrect;
           points = aiGr.points;
         } else {
           const userText = String(uPayload).toLowerCase();
           const targetKey = refStr.toLowerCase().split(/[\s,.;]+/);
           const matches = targetKey.filter(w => w.length > 3 && userText.includes(w)).length;
           const relevance = matches / Math.max(targetKey.filter(w => w.length > 3).length, 1);
           isCorrect = relevance >= 0.5;
           points = Math.round(relevance * 10);
         }
       } else if (qType === 'code') {
         const aiGr = await this.aiService.gradeExamAnswer({
           questionText: qText,
           expectedAnswer: refStr,
           studentAnswer: String(uPayload ?? ''),
           questionType: 'code',
         });
         if (aiGr) {
           isCorrect = aiGr.isCorrect;
           points = aiGr.points;
         } else {
           const code = String(uPayload);
           const keywords = ['function', 'return', 'const', 'let', 'for', 'while', 'if', 'Map', 'Set', 'stack'];
           const matchCount = keywords.filter(k => code.includes(k)).length;
           const structuralScore = (matchCount / keywords.length) * 100;
           isCorrect = structuralScore > 40;
           points = isCorrect ? 10 : 0;
         }
       }

       if (isCorrect) correctCount++;

       const pts = points || (isCorrect ? 10 : 0);
       try {
         await this.dbService.query(
           `UPDATE attempt_answers SET is_correct = $1, points_earned = $2 WHERE id = $3`,
           [isCorrect, pts, ans.id],
         );
       } catch (e: any) {
         if (e?.code === '42703') {
           await this.dbService.query(
             `UPDATE attempt_answers SET is_correct = $1, earned_points = $2 WHERE id = $3`,
             [isCorrect, pts, ans.id],
           );
         } else {
           throw e;
         }
       }
    }

    const finalScore = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    const result = await this.dbService.query(`
      UPDATE exam_attempts 
      SET status = 'submitted', finished_at = NOW(), score = $1 
      WHERE id = $2 RETURNING *
    `, [finalScore, attemptId]);

    const incorrectCount = Math.max(0, totalCount - correctCount);
    const passed = finalScore >= 50;
    const attTimes = await this.dbService.query(
      `SELECT started_at, finished_at FROM exam_attempts WHERE id = $1`,
      [attemptId],
    );
    let timeTakenRow = 0;
    if (attTimes[0]?.started_at && attTimes[0]?.finished_at) {
      timeTakenRow = Math.floor(
        (new Date(attTimes[0].finished_at).getTime() -
          new Date(attTimes[0].started_at).getTime()) /
          1000,
      );
    }

    const syncExamResults = async () => {
      const baseParams = [
        exam_id,
        student_id,
        finalScore,
        correctCount,
        incorrectCount,
        totalCount,
        timeTakenRow,
      ];
      const updates: Array<{ sql: string; params: any[] }> = [
        {
          sql: `UPDATE exam_results SET score = $3::numeric, correct_count = $4, incorrect_count = $5, total_questions = $6, time_taken = $7, updated_at = NOW()
         WHERE exam_id = $1 AND student_id = $2 RETURNING id`,
          params: baseParams,
        },
        {
          sql: `UPDATE exam_results SET score = $3::numeric, correct_count = $4, incorrect_count = $5, total_questions = $6, time_taken = $7
         WHERE exam_id = $1 AND student_id = $2 RETURNING id`,
          params: baseParams,
        },
        {
          sql: `UPDATE exam_results SET score = $3::numeric, correct_count = $4, incorrect_count = $5, total_questions = $6
         WHERE exam_id = $1 AND student_id = $2 RETURNING id`,
          params: baseParams.slice(0, 6),
        },
        {
          sql: `UPDATE exam_results SET score = $3::numeric WHERE exam_id = $1 AND student_id = $2 RETURNING id`,
          params: [exam_id, student_id, finalScore],
        },
      ];
      for (const u of updates) {
        try {
          const updated = await this.dbService.query(u.sql, u.params);
          if (updated.length) return;
        } catch (e: any) {
          if (e?.code !== '42703' && e?.code !== '42P01') {
            this.logger.warn(`exam_results UPDATE variant skipped: ${e?.message || e}`);
          }
        }
      }
      const inserts: Array<{ sql: string; params: any[] }> = [
        {
          sql: `INSERT INTO exam_results (id, attempt_id, exam_id, student_id, score, passed, correct_count, incorrect_count, total_questions, time_taken)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          params: [
            attemptId,
            exam_id,
            student_id,
            finalScore,
            passed,
            correctCount,
            incorrectCount,
            totalCount,
            timeTakenRow,
          ],
        },
        {
          sql: `INSERT INTO exam_results (id, attempt_id, exam_id, student_id, score, passed)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
          params: [attemptId, exam_id, student_id, finalScore, passed],
        },
      ];
      for (const ins of inserts) {
        try {
          await this.dbService.query(ins.sql, ins.params);
          return;
        } catch (e: any) {
          this.logger.warn(`exam_results INSERT skipped: ${e?.message || e}`);
        }
      }
    };
    await syncExamResults();

    // Send Telegram Notification
    try {
      const student = await this.dbService.query(`SELECT first_name, telegram_chat_id FROM students WHERE id = $1`, [student_id]);
      const exam = await this.dbService.query(`SELECT title FROM exams WHERE id = $1`, [exam_id]);
      if (student.length && student[0].telegram_chat_id) {
        await this.telegramService.notifyExamResult(
          student[0].telegram_chat_id, 
          student[0].first_name, 
          exam[0].title, 
          finalScore,
          student_id
        );
      }
    } catch (e) {
      // Non-blocking
    }

    return result[0];
  }

  async getAttemptResult(attemptId: string) {
    const attempt = await this.dbService.query(`
      SELECT a.*, e.title as exam_title
      FROM exam_attempts a
      JOIN exams e ON a.exam_id = e.id
      WHERE a.id = $1
    `, [attemptId]);

    if (!attempt.length) return null;

    let details: any[];
    try {
      details = await this.dbService.query(
        `
      SELECT aa.*, q.text as question_text, q.options as question_options, q.correct_answer, q.type as question_type
      FROM attempt_answers aa
      JOIN questions q ON aa.question_id = q.id
      WHERE aa.attempt_id = $1
    `,
        [attemptId],
      );
    } catch (e: any) {
      if (e?.code !== '42703') throw e;
      details = await this.dbService.query(
        `
      SELECT aa.*, q.text as question_text, q.correct_answer, q.type as question_type
      FROM attempt_answers aa
      JOIN questions q ON aa.question_id = q.id
      WHERE aa.attempt_id = $1
    `,
        [attemptId],
      );
    }

    const correct_count = details.filter((d) => d.is_correct).length;
    const incorrect_count = details.length - correct_count;
    
    // Time calculation (sekundlar; 0 ham “sarf vaqt” hisoblanadi)
    let time_taken = 0;
    const started = attempt[0].started_at ? new Date(attempt[0].started_at).getTime() : NaN;
    const finished = attempt[0].finished_at ? new Date(attempt[0].finished_at).getTime() : NaN;
    if (!Number.isNaN(started) && !Number.isNaN(finished) && finished >= started) {
      time_taken = Math.floor((finished - started) / 1000);
    }
    if (time_taken <= 0) {
      try {
        const er = await this.dbService.query(`SELECT time_taken FROM exam_results WHERE attempt_id = $1 LIMIT 1`, [
          attemptId,
        ]);
        const tt = er[0]?.time_taken;
        if (tt != null && Number(tt) >= 0) time_taken = Number(tt);
      } catch {
        /* */
      }
    }

    const rawScore = attempt[0].score;
    const scoreNum =
      rawScore === null || rawScore === undefined || rawScore === ''
        ? null
        : Number(rawScore);

    return { 
      ...attempt[0], 
      score: scoreNum != null && !Number.isNaN(scoreNum) ? scoreNum : rawScore,
      details,
      correct_count,
      incorrect_count,
      total_questions: details.length,
      time_taken,
    };
  }

  async findAllByCourse(courseId: string) {
    return all_exams_by_course(this.dbService, courseId);
  }

  async getExamResults(examId: string) {
    return get_exam_results(this.dbService, examId);
  }

  async getStudentResults(studentId: string) {
    return this.dbService.query(`
      SELECT er.*, e.title as exam_title, e.total_points
      FROM exam_results er
      JOIN exams e ON er.exam_id = e.id
      WHERE er.student_id = $1
      ORDER BY er.created_at DESC NULLS LAST
    `, [studentId]);
  }

  /** Guruh a'zolariga bildirishnoma + Socket (imtihon birinchi marta nashr qilinganda). */
  private async notifyStudentsExamPublished(exam: Record<string, unknown>) {
    const examId = exam?.id as string | undefined;
    const title = String(exam?.title ?? 'Imtihon');
    const groupId = exam?.group_id as string | undefined;
    if (!examId || !groupId) return;

    let rows: { student_id: string }[];
    try {
      rows = await this.dbService.query(
        `SELECT student_id FROM group_students WHERE group_id = $1 AND (left_at IS NULL)`,
        [groupId],
      );
    } catch (e: any) {
      if (e?.code !== '42703') return;
      rows = await this.dbService.query(`SELECT student_id FROM group_students WHERE group_id = $1`, [groupId]);
    }

    const msg = `${title} — imtihon e'lon qilindi. «Imtihonlar» bo'limidan topshirishingiz mumkin.`;
    for (const r of rows) {
      const sid = r.student_id;
      await this.dbService
        .query(`INSERT INTO notifications (student_id, title, message) VALUES ($1, $2, $3)`, [
          sid,
          'Yangi imtihon',
          msg,
        ])
        .catch(() => {});
      this.socketsGateway.emitToRoom(`user:${sid}`, 'exam_published', {
        examId,
        title,
        message: msg,
      });
    }

    this.socketsGateway.emitToAll('exam_published', {
      examId,
      title,
      groupId,
    });
  }
}
