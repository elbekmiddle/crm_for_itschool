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
import { validate as uuidValidate } from 'uuid';

import { TelegramService } from '../../infrastructure/notifications/telegram.service';
import { SocketsGateway } from '../sockets/sockets.gateway';
import { AiService } from '../ai/ai.service';
import { GroupsService } from '../groups/groups.service';

/**
 * CRM (TeacherExamReview) MCQ/TF uchun to‘g‘ri javob — variantning 0-based indeksi (0,1,2…).
 * Imtihon platformasi esa AnswerInput orqali variant id sifatida 1-based ("1","2",…) yuboradi.
 * Shuning uchun `correct===1` bilan talaba `"2"` mos kelishi kerak, `"1"` emas.
 */
function matchMcqOrTfStudentToCorrect(studentPayload: unknown, correctRaw: unknown): boolean {
  const uStr = String(studentPayload ?? '').trim();
  const cStr = String(correctRaw ?? '').trim();
  const uNum = Number(uStr);
  const cNum = Number(correctRaw);
  /** CRM 0-based variant indeksi — talaba 1-based ("1","2"…) yuboradi; `"2"` bilan `correct===2` string tengligi yolg‘on musbat berardi. */
  if (Number.isFinite(cNum) && Number.isInteger(cNum) && cNum >= 0 && cNum <= 40) {
    return Number.isFinite(uNum) && uNum === cNum + 1;
  }
  return uStr !== '' && cStr !== '' && uStr === cStr;
}

/** PATCH body kalitlari — SQL injection (ustun nomi) oldini olish */
const ALLOWED_EXAM_PATCH_FIELDS = new Set([
  'course_id',
  'title',
  'description',
  'duration_minutes',
  'time_limit',
  'passing_score',
  'total_points',
  'status',
  'shuffle_questions',
  'show_answers_feedback',
  'allow_review',
  'hide_correct_answers',
  'randomize_answer_order',
  'enable_anti_cheat',
  'max_attempts',
  'start_date',
  'end_date',
  'start_time',
  'end_time',
  'instructions',
  'time_warning_minutes',
  'allow_calculator',
  'allow_notes',
  'show_progress_bar',
  'show_timer',
  'allow_back_tracking',
  'lock_questions',
  'proctor_required',
  'record_session',
  'verify_identity',
  'full_screen_required',
  'webcam_required',
  'microphone_required',
  'notification_email',
  'group_id',
]);

const ALLOWED_QUESTION_PATCH_FIELDS = new Set([
  'text',
  'options',
  'correct_answer',
  'type',
  'level',
  'status',
  'lesson_id',
]);

function matchMultiSelectIndices(studentPayload: unknown, correctRaw: unknown): boolean {
  const uArr = Array.isArray(studentPayload) ? studentPayload : [];
  const cArr = Array.isArray(correctRaw) ? correctRaw : [];
  if (!cArr.length) return false;
  const c0 = cArr
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && Number.isInteger(n) && n >= 0)
    .sort((a, b) => a - b);
  let uRaw = uArr
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && Number.isInteger(n))
    .sort((a, b) => a - b);
  /** exam-platform: variant id lari 1-based ("1","2"…). CRM / frontend: 0-based indekslar. */
  if (uRaw.length && uRaw[0] >= 1) {
    uRaw = uRaw.map((v) => v - 1);
  }
  if (c0.length !== uRaw.length) return false;
  return c0.every((v, i) => v === uRaw[i]);
}

@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(
    private readonly dbService: DbService, 
    private readonly queueService: QueueService,
    private readonly telegramService: TelegramService,
    private readonly socketsGateway: SocketsGateway,
    private readonly aiService: AiService,
    private readonly groupsService: GroupsService,
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

  async findOne(id: string, options?: { viewerRole?: string }) {
    if (!uuidValidate(id)) {
      throw new NotFoundException('Imtihon topilmadi');
    }
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

    const revealCorrectAnswers =
      options?.viewerRole === 'TEACHER' ||
      options?.viewerRole === 'ADMIN' ||
      options?.viewerRole === 'MANAGER';

    const normalized = questions.map((q: any) => {
      const row = {
        ...q,
        options: parseJson(q.options, []),
        correct_answer: parseJson(q.correct_answer, q.correct_answer),
        type: String(q.type || 'multiple_choice').toLowerCase().replace(/-/g, '_'),
      };
      if (!revealCorrectAnswers) {
        const { correct_answer: _omit, ...rest } = row;
        return rest;
      }
      return row;
    });

    let group_name: string | null = null;
    const gid = exam[0]?.group_id;
    if (gid) {
      const gr = await this.dbService.query(`SELECT name FROM groups WHERE id = $1`, [gid]);
      group_name = gr[0]?.name ?? null;
    }

    const row = exam[0];
    let individual_student_ids: string[] = [];
    try {
      const indRows = await this.dbService.query(
        `SELECT student_id FROM exam_individual_students WHERE exam_id = $1 ORDER BY student_id`,
        [id],
      );
      individual_student_ids = (indRows || []).map((r: any) => String(r.student_id));
    } catch (e: any) {
      if (e?.code !== '42P01' && e?.code !== '42703') throw e;
    }
    return {
      ...row,
      group_name,
      individual_student_ids,
      questions: normalized,
      duration: row.duration_minutes ?? row.time_limit ?? row.duration ?? 60,
      questions_count: normalized.length,
    };
  }

  private async assertTeacherIndividualStudents(
    teacherId: string,
    courseId: string,
    ids: string[],
  ) {
    const allowed = await this.groupsService.findTeacherStudentsWithoutGroup(teacherId);
    const byId = new Map(allowed.map((r: any) => [String(r.id), r]));
    for (const raw of ids) {
      const id = String(raw);
      const row = byId.get(id);
      if (!row) {
        throw new ForbiddenException(
          'Baʼzi talabalar sizning «guruhga kirmagan» roʻyxatingizda emas yoki boshqa kursga tegishli.',
        );
      }
      if (courseId && row.course_id != null && String(row.course_id) !== String(courseId)) {
        throw new BadRequestException(
          'Tanlangan alohida talabalar imtihon kursi bilan mos kelmaydi (har biri faol kursga yozilgan boʻlishi kerak).',
        );
      }
    }
  }

  /** Nashr qilishdan oldin kamida bitta savol borligini tekshiradi */
  private async assertExamHasAtLeastOneQuestion(examId: string) {
    try {
      const r = await this.dbService.query(
        `SELECT COUNT(*)::int AS n FROM exam_questions WHERE exam_id = $1`,
        [examId],
      );
      const n = Number(r[0]?.n) || 0;
      if (n < 1) {
        throw new BadRequestException(
          "Nashr qilish mumkin emas: imtihonda savol yo'q. Avval kamida bitta savol qo'shing.",
        );
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      if (e?.code === '42P01') {
        throw new BadRequestException(
          "Nashr qilish mumkin emas: savollar jadvali topilmadi.",
        );
      }
      throw e;
    }
  }

  async create(createExamDto: CreateExamDto, teacherId: string, role?: string) {
    const rawInd = createExamDto.individual_student_ids;
    const individualStudentIds = Array.isArray(rawInd)
      ? [...new Set(rawInd.filter((x) => x && String(x).trim()))]
      : [];
    if (individualStudentIds.length > 4) {
      throw new BadRequestException('Alohida talabalarni maksimal 4 tagacha belgilash mumkin.');
    }
    const hasGroup = !!createExamDto.group_id?.trim();
    if (role === 'TEACHER') {
      if (!hasGroup && individualStudentIds.length === 0) {
        throw new BadRequestException(
          "Guruhni tanlang yoki kamida bitta alohida talabani belgilang — nashr qilinganda faqat ular ko'radi.",
        );
      }
      if (individualStudentIds.length > 0) {
        await this.assertTeacherIndividualStudents(teacherId, createExamDto.course_id, individualStudentIds);
      }
    }
    const newExam = await create_exam(
      this.dbService,
      createExamDto,
      teacherId,
      individualStudentIds.length ? individualStudentIds : undefined,
    );
    this.socketsGateway.emitToAll('exam_created', newExam);
    this.socketsGateway.emitDashboardRefresh({ source: 'exam', action: 'created' });
    return newExam;
  }

  async update(id: string, data: any) {
    const { questions: _nestedQuestions, ...rest } = data || {};
    const keys = Object.keys(rest).filter((k) => ALLOWED_EXAM_PATCH_FIELDS.has(k));
    if (!keys.length) {
      const one = await this.findOne(id, { viewerRole: 'TEACHER' });
      return one;
    }
    const prevStatusRows = await this.dbService.query(`SELECT status FROM exams WHERE id = $1`, [id]);
    const prevStatus = prevStatusRows[0]?.status as string | undefined;

    const becomingPublished =
      String(rest.status ?? '').toLowerCase() === 'published' && String(prevStatus ?? '').toLowerCase() !== 'published';
    if (becomingPublished) {
      await this.assertExamHasAtLeastOneQuestion(id);
    }

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
          const hasGroup = row.group_id != null && row.group_id !== '';
          let hasIndividuals = false;
          try {
            const c = await this.dbService.query(
              `SELECT COUNT(*)::int AS n FROM exam_individual_students WHERE exam_id = $1`,
              [id],
            );
            hasIndividuals = Number(c[0]?.n) > 0;
          } catch (e: any) {
            if (e?.code !== '42P01' && e?.code !== '42703') throw e;
          }
          if (!hasGroup && !hasIndividuals) {
            throw new BadRequestException(
              "Avval imtihonni tahrirlab guruh yoki alohida talabalarni bog'lang.",
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
    for (const k of Object.keys(row)) {
      if (!ALLOWED_QUESTION_PATCH_FIELDS.has(k)) delete row[k];
    }
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

    await this.assertExamHasAtLeastOneQuestion(examId);

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
    if (!exam.length) throw new NotFoundException('Imtihon topilmadi');

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
      AND (
        EXISTS (
        SELECT 1 FROM groups gx
        INNER JOIN group_students gs ON gs.group_id = gx.id AND gs.student_id = $1
        WHERE gx.course_id = e.course_id
        ${scope}
        )
        OR EXISTS (
          SELECT 1 FROM exam_individual_students eis
          WHERE eis.exam_id = e.id AND eis.student_id = $1
        )
      )
    `;
      };

      const durationVariants = [
        'COALESCE(e.duration_minutes, e.time_limit, 60)',
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
    const sqlWithIndividuals = `
      SELECT e.id, COALESCE(e.duration_minutes, e.time_limit, 60) AS time_limit FROM exams e
       WHERE e.id = $1 AND e.status = 'published'
       AND (
         EXISTS (
           SELECT 1 FROM groups gx
           INNER JOIN group_students gs ON gs.group_id = gx.id AND gs.student_id = $2
           WHERE gx.course_id = e.course_id
           AND (e.group_id IS NULL OR e.group_id = gx.id)
         )
         OR EXISTS (
           SELECT 1 FROM exam_individual_students eis
           WHERE eis.exam_id = e.id AND eis.student_id = $2
         )
       )`;
    const sqlGroupFallback = `
      SELECT e.id, COALESCE(e.duration_minutes, e.time_limit, 60) AS time_limit FROM exams e
       WHERE e.id = $1 AND e.status = 'published'
       AND EXISTS (
         SELECT 1 FROM groups gx
         INNER JOIN group_students gs ON gs.group_id = gx.id AND gs.student_id = $2
         WHERE gx.course_id = e.course_id
         AND (e.group_id IS NULL OR e.group_id = gx.id)
       )`;
    try {
      exam = await this.dbService.query(sqlWithIndividuals, [examId, studentId]);
    } catch (e: any) {
      if (e?.code === '42P01') {
        try {
          exam = await this.dbService.query(sqlGroupFallback, [examId, studentId]);
        } catch (e2: any) {
          if (e2?.code !== '42703') throw e2;
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
        }
      } else if (e?.code === '42703') {
        exam = await this.dbService.query(sqlGroupFallback, [examId, studentId]);
      } else {
        throw e;
      }
    }
    if (!exam.length) {
      throw new NotFoundException(
        "Imtihon topilmadi, nashr qilinmagan yoki sizga biriktirilgan guruh / ro‘yxat uchun emas.",
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
        throw new BadRequestException('Imtihon vaqti tugadi. Sessiya yopildi.');
      }
      return activeAttempt[0];
    }

    const priorFinished = await this.dbService.query(
      `
      SELECT id FROM exam_attempts
      WHERE exam_id = $1 AND student_id = $2
        AND status IN ('submitted', 'graded', 'timed_out')
      LIMIT 1
    `,
      [examId, studentId],
    );
    if (priorFinished.length) {
      throw new ConflictException("Bu imtihonni allaqachon topshirgansiz.");
    }

    // 3. Create new attempt
    const deadline = dayjs().add(exam[0].time_limit, 'minute').toDate();
    const result = await this.dbService.query(`
      INSERT INTO exam_attempts (exam_id, student_id, deadline_at, started_at) 
      VALUES ($1, $2, $3, NOW()) RETURNING *
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
    if (!attempt.length) throw new NotFoundException('Urinish topilmadi.');

    /** Tartibni imtihon savollari bilan moslashtiramiz. Eski sxemalarda `exam_questions.created_at` / `question_order` bo‘lmasligi mumkin. */
    const questionSelect = `
      SELECT q.id, q.text, q.options, q.level, q.type
      FROM questions q
      JOIN exam_questions eq ON eq.question_id = q.id
      WHERE eq.exam_id = $1`;
    /** Avval `created_at` siz — ko‘p sxemalarda `exam_questions.created_at` ustuni yo‘q (42703). */
    const orderVariants = [
      ` ORDER BY COALESCE(eq.question_order, 2147483647), q.id`,
      ` ORDER BY COALESCE(eq.question_order, 2147483647), eq.created_at ASC NULLS LAST, q.id`,
      ` ORDER BY eq.created_at ASC NULLS LAST, q.id`,
      ` ORDER BY q.id`,
    ];
    let questions: any[] | undefined;
    let lastErr: any;
    for (const ord of orderVariants) {
      try {
        questions = await this.dbService.query(questionSelect + ord, [attempt[0].exam_id]);
        lastErr = undefined;
        break;
      } catch (e: any) {
        lastErr = e;
        if (e?.code !== '42703') throw e;
      }
    }
    if (!questions) {
      throw lastErr || new BadRequestException('Savollarni yuklab bo‘lmadi.');
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
    if (clientTime) {
      const serverTime = Date.now();
      if (clientTime > serverTime + 300000) {
        throw new ForbiddenException("Time manipulation detected");
      }
    }

    const payloadStr = JSON.stringify(payload ?? null);
    const attempts = [
      `
      INSERT INTO attempt_answers (attempt_id, question_id, answer)
      SELECT $1, $2, $3::jsonb
      WHERE EXISTS (
        SELECT 1 FROM exam_attempts ea
        WHERE ea.id = $1 AND ea.status = 'in_progress'
          AND (ea.deadline_at IS NULL OR ea.deadline_at > NOW())
      )
      ON CONFLICT (attempt_id, question_id) DO UPDATE
      SET answer = EXCLUDED.answer, answered_at = NOW()
      WHERE EXISTS (
        SELECT 1 FROM exam_attempts ea
        WHERE ea.id = EXCLUDED.attempt_id AND ea.status = 'in_progress'
          AND (ea.deadline_at IS NULL OR ea.deadline_at > NOW())
      )
      RETURNING id
    `,
      `
      INSERT INTO attempt_answers (attempt_id, question_id, answer_payload)
      SELECT $1, $2, $3
      WHERE EXISTS (
        SELECT 1 FROM exam_attempts ea
        WHERE ea.id = $1 AND ea.status = 'in_progress'
          AND (ea.deadline_at IS NULL OR ea.deadline_at > NOW())
      )
      ON CONFLICT (attempt_id, question_id) DO UPDATE
      SET answer_payload = EXCLUDED.answer_payload, answered_at = NOW()
      WHERE EXISTS (
        SELECT 1 FROM exam_attempts ea
        WHERE ea.id = EXCLUDED.attempt_id AND ea.status = 'in_progress'
          AND (ea.deadline_at IS NULL OR ea.deadline_at > NOW())
      )
      RETURNING id
    `,
    ];

    let last: any;
    for (const sql of attempts) {
      try {
        const rows = await this.dbService.query(sql, [attemptId, questionId, payloadStr]);
        if (!rows.length) {
          throw new ConflictException('Exam session is not active.');
        }
        return rows;
      } catch (e: any) {
        if (e instanceof ConflictException) throw e;
        last = e;
        if (e?.code !== '42703') throw e;
      }
    }
    throw last;
  }

  /** Anti-cheat: frontend yoki boshqa manbadan — serverda qayd etiladi */
  async reportViolation(attemptId: string, studentId: string, type: string) {
    const rows = await this.dbService.query(
      `SELECT id, student_id, status, deadline_at FROM exam_attempts WHERE id = $1`,
      [attemptId],
    );
    if (!rows.length) throw new NotFoundException('Urinish topilmadi.');
    if (String(rows[0].student_id) !== String(studentId)) {
      throw new ForbiddenException('Bu urinish sizga tegishli emas.');
    }
    const st = String(rows[0].status ?? '').toLowerCase();
    if (st !== 'in_progress') {
      throw new ConflictException('Sessiya aktiv emas.');
    }
    const dl = rows[0].deadline_at;
    if (dl && new Date(dl).getTime() <= Date.now()) {
      throw new ForbiddenException('Imtihon vaqti tugagan.');
    }
    const vtype = String(type || 'unknown').slice(0, 64) || 'unknown';
    try {
      await this.dbService.query(
        `UPDATE exam_attempts SET violation_count = COALESCE(violation_count, 0) + 1 WHERE id = $1`,
        [attemptId],
      );
    } catch (e: any) {
      if (e?.code !== '42703') throw e;
    }
    try {
      await this.dbService.query(
        `INSERT INTO exam_violations (attempt_id, violation_type) VALUES ($1, $2)`,
        [attemptId, vtype],
      );
    } catch (e: any) {
      if (e?.code !== '42P01' && e?.code !== '42703') throw e;
    }
    return { ok: true, violation_type: vtype };
  }

  async submitExamAttempt(attemptId: string) {
    return this.finishAttempt(attemptId);
  }

  private async finishAttempt(attemptId: string) {
    const attempt = await this.dbService.query(
      `SELECT exam_id, student_id, status FROM exam_attempts WHERE id = $1`,
      [attemptId],
    );
    if (!attempt.length) throw new NotFoundException('Urinish topilmadi.');

    const st = String(attempt[0].status ?? '').toLowerCase();
    if (st && st !== 'in_progress') {
      const existing = await this.dbService.query(`SELECT * FROM exam_attempts WHERE id = $1`, [attemptId]);
      return existing[0];
    }

    const { exam_id, student_id } = attempt[0];

    let passThreshold = 60;
    try {
      const pe = await this.dbService.query(`SELECT passing_score FROM exams WHERE id = $1`, [exam_id]);
      const raw = pe[0]?.passing_score;
      if (raw != null && raw !== '' && Number.isFinite(Number(raw))) {
        passThreshold = Math.min(100, Math.max(0, Number(raw)));
      }
    } catch (e: any) {
      if (e?.code !== '42703') throw e;
    }

    // Calculate score
    const answers = await this.dbService.query(
      `
      SELECT aa.*,
        q.type AS q_type, q.text AS q_text, q.correct_answer AS q_correct_answer
      FROM attempt_answers aa
      JOIN questions q ON aa.question_id = q.id
      WHERE aa.attempt_id = $1
    `,
      [attemptId],
    );

    const totalQuestions = await this.dbService.query(`SELECT count(*) FROM exam_questions WHERE exam_id = $1`, [exam_id]);
    const totalCount = parseInt(totalQuestions[0].count) || 0;

    let correctCount = 0;
    
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

    for (const ans of answers) {
       let isCorrect = false;
       let points = 0;
       let qType = String(ans.q_type || '')
         .toLowerCase()
         .replace(/-/g, '_');
       if (qType === 'select' || qType === 'mcq') qType = 'multiple_choice';
       if (qType === 'boolean' || qType === 'tf') qType = 'true_false';

       const qCorrectRaw = unwrapCorrect(ans.q_correct_answer);
       const qText = String(ans.q_text || '');
       const rawAns =
         ans.answer_payload != null && ans.answer_payload !== ''
           ? ans.answer_payload
           : ans.answer;
       const uPayload = unwrapPayloadCell(rawAns);
       const refStr =
         typeof qCorrectRaw === 'string' || typeof qCorrectRaw === 'number'
           ? String(qCorrectRaw)
           : JSON.stringify(qCorrectRaw ?? '');

       // Enhanced AI evaluation
       if (qType === 'multiple_choice' || qType === 'true_false') {
         isCorrect = matchMcqOrTfStudentToCorrect(uPayload, qCorrectRaw);
       } else if (qType === 'multi_select' || qType === 'multiple_select') {
         isCorrect = matchMultiSelectIndices(uPayload, qCorrectRaw);
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

       const rawPts = points ?? (isCorrect ? 10 : 0);
       /** DB: `points_earned` INTEGER — AI ba'zan 6.5 kabi kasr qaytaradi */
       const pts = Math.round(Math.min(10, Math.max(0, Number(rawPts) || 0)));
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

    const result = await this.dbService.query(
      `
      UPDATE exam_attempts
      SET status = 'submitted', finished_at = NOW(), score = $1
      WHERE id = $2 AND status = 'in_progress'
      RETURNING *
    `,
      [finalScore, attemptId],
    );

    if (!result.length) {
      const existing = await this.dbService.query(`SELECT * FROM exam_attempts WHERE id = $1`, [attemptId]);
      return existing[0];
    }

    const incorrectCount = Math.max(0, totalCount - correctCount);
    const passed = finalScore >= passThreshold;
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
      try {
        const byAttempt = await this.dbService.query(
          `SELECT id FROM exam_results WHERE attempt_id = $1 LIMIT 1`,
          [attemptId],
        );
        if (byAttempt.length) {
          const erId = byAttempt[0].id;
          const fullUpdate = `
            UPDATE exam_results SET
              score = $1::numeric,
              passed = $2,
              correct_count = $3,
              incorrect_count = $4,
              total_questions = $5,
              time_taken = $6,
              updated_at = NOW()
            WHERE id = $7
          `;
          try {
            await this.dbService.query(fullUpdate, [
              finalScore,
              passed,
              correctCount,
              incorrectCount,
              totalCount,
              timeTakenRow,
              erId,
            ]);
            return;
          } catch (e: any) {
            try {
              await this.dbService.query(
                `UPDATE exam_results SET score = $1::numeric, passed = $2, updated_at = NOW() WHERE id = $3`,
                [finalScore, passed, erId],
              );
            } catch (e2: any) {
              this.logger.warn(`exam_results UPDATE by id fallback: ${e2?.message || e2}`);
            }
            return;
          }
        }
      } catch (e: any) {
        if (e?.code !== '42P01' && e?.code !== '42703') {
          this.logger.warn(`exam_results by attempt_id: ${e?.message || e}`);
        }
      }

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
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (exam_id, student_id) DO UPDATE SET
             attempt_id = EXCLUDED.attempt_id,
             score = EXCLUDED.score,
             passed = EXCLUDED.passed,
             correct_count = EXCLUDED.correct_count,
             incorrect_count = EXCLUDED.incorrect_count,
             total_questions = EXCLUDED.total_questions,
             time_taken = EXCLUDED.time_taken,
             updated_at = NOW()`,
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

  async getAttemptResult(
    attemptId: string,
    viewer?: { viewerRole?: string; viewerId?: string },
  ) {
    const attempt = await this.dbService.query(`
      SELECT a.*, e.title as exam_title
      FROM exam_attempts a
      JOIN exams e ON a.exam_id = e.id
      WHERE a.id = $1
    `, [attemptId]);

    if (!attempt.length) return null;

    if (viewer?.viewerRole === 'STUDENT' && viewer.viewerId && attempt[0].student_id !== viewer.viewerId) {
      throw new ForbiddenException('Bu urinish sizga tegishli emas.');
    }

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

    if (viewer?.viewerRole === 'STUDENT') {
      details = details.map((d: any) => {
        const { correct_answer: _omit, ...rest } = d;
        return rest;
      });
    }

    const correct_count = details.filter((d) => d.is_correct).length;
    const incorrect_count = details.length - correct_count;

    let time_taken = 0;
    let fromResults = false;
    try {
      const er = await this.dbService.query(`SELECT time_taken FROM exam_results WHERE attempt_id = $1 LIMIT 1`, [
        attemptId,
      ]);
      const tt = er[0]?.time_taken;
      if (tt != null && Number(tt) > 0) {
        time_taken = Math.floor(Number(tt));
        fromResults = true;
      }
    } catch {
      /* */
    }
    if (!fromResults) {
      const started = attempt[0].started_at ? new Date(attempt[0].started_at).getTime() : NaN;
      const finished = attempt[0].finished_at ? new Date(attempt[0].finished_at).getTime() : NaN;
      if (!Number.isNaN(started) && !Number.isNaN(finished) && finished >= started) {
        time_taken = Math.floor((finished - started) / 1000);
      }
    }
    if (time_taken <= 0 && attempt[0].created_at && attempt[0].finished_at) {
      const c = new Date(attempt[0].created_at).getTime();
      const f = new Date(attempt[0].finished_at).getTime();
      if (!Number.isNaN(c) && !Number.isNaN(f) && f >= c) {
        time_taken = Math.floor((f - c) / 1000);
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
    if (!examId) return;

    const msg = `${title} — imtihon e'lon qilindi. «Imtihonlar» bo'limidan topshirishingiz mumkin.`;
    const notifySid = (sid: string) => {
      void this.dbService
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
    };

    if (groupId) {
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
      for (const r of rows) notifySid(r.student_id);
    }

    try {
      const ind = await this.dbService.query(
        `SELECT student_id FROM exam_individual_students WHERE exam_id = $1`,
        [examId],
      );
      for (const r of ind || []) notifySid(r.student_id);
    } catch (e: any) {
      if (e?.code !== '42P01' && e?.code !== '42703') throw e;
    }

    this.socketsGateway.emitToAll('exam_published', {
      examId,
      title,
      groupId: groupId ?? null,
    });
  }
}
