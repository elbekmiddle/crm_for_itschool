import { Injectable, BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { QueueService } from '../../infrastructure/queue/queue.service';
import { all_exams_by_course } from './queries/all_exams_by_course';
import { get_exam_results } from './queries/get_exam_results';
import { create_exam } from './commands/create_exam';
import { add_questions_to_exam } from './commands/add_questions_to_exam';
import * as dayjs from 'dayjs';

import { TelegramService } from '../../infrastructure/notifications/telegram.service';
import { SocketsGateway } from '../sockets/sockets.gateway';
@Injectable()
export class ExamsService {
  constructor(
    private readonly dbService: DbService, 
    private readonly queueService: QueueService,
    private readonly telegramService: TelegramService,
    private readonly socketsGateway: SocketsGateway
  ) {}

  async findAll() {
    return this.dbService.query(`
      SELECT 
        e.*, 
        c.name as course_name,
        (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) as question_count,
        (SELECT ROUND(AVG(score)) FROM exam_results WHERE exam_id = e.id) as avg_score
      FROM exams e 
      JOIN courses c ON e.course_id = c.id 
      WHERE e.deleted_at IS NULL
      ORDER BY e.created_at DESC
    `);
  }

  async findOne(id: string) {
    const exam = await this.dbService.query(`
      SELECT e.*, c.name as course_name
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      WHERE e.id = $1 AND e.deleted_at IS NULL
    `, [id]);
    if (!exam.length) throw new NotFoundException('Imtihon topilmadi');
    
    const questions = await this.dbService.query(`
      SELECT q.* 
      FROM questions q
      JOIN exam_questions eq ON q.id = eq.question_id
      WHERE eq.exam_id = $1
    `, [id]);
    
    return { ...exam[0], questions };
  }

  async create(createExamDto: CreateExamDto, teacherId: string) {
    const newExam = await create_exam(this.dbService, createExamDto, teacherId);
    this.socketsGateway.emitToAll('exam_created', newExam);
    return newExam;
  }

  async update(id: string, data: any) {
    const fields = Object.keys(data).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = Object.values(data);
    const result = await this.dbService.query(
      `UPDATE exams SET ${fields} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    this.socketsGateway.emitToAll('exam_updated', result[0]);
    if (data.status === 'published' || data.status === 'approved') {
       this.socketsGateway.emitToAll('exam_approved', result[0]);
    }
    return result[0];
  }

  async remove(id: string) {
    return this.dbService.query(`UPDATE exams SET deleted_at = NOW() WHERE id = $1`, [id]);
  }

  async addQuestionsToExam(examId: string, questionIds: string[]) {
    return add_questions_to_exam(this.dbService, examId, questionIds);
  }

  async addNewQuestion(examId: string, data: any) {
    const lessonId = data.lesson_id || null;
    const result = await this.dbService.query(`
      INSERT INTO questions (lesson_id, text, options, correct_answer, level, type, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'draft') RETURNING *
    `, [
      lessonId, 
      data.text || 'Yangi savol', 
      JSON.stringify(data.options || []), 
      data.correct_answer ? JSON.stringify(data.correct_answer) : null, 
      data.level || 'medium', 
      data.type || 'multiple_choice'
    ]);
    
    await this.dbService.query(`
      INSERT INTO exam_questions (exam_id, question_id) VALUES ($1, $2)
    `, [examId, result[0].id]);

    this.socketsGateway.emitToAll('exam_updated', { examId });
    return result[0];
  }

  async removeQuestionFromExam(examId: string, questionId: string) {
    return this.dbService.query(
      `DELETE FROM exam_questions WHERE exam_id = $1 AND question_id = $2`,
      [examId, questionId]
    );
  }

  async updateQuestion(examId: string, questionId: string, data: any) {
    const fields = Object.keys(data).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = Object.values(data);
    const result = await this.dbService.query(
      `UPDATE questions SET ${fields} WHERE id = $1 RETURNING *`,
      [questionId, ...values]
    );
    this.socketsGateway.emitToAll('exam_updated', { examId });
    return result[0];
  }

  async approveAllQuestions(examId: string) {
    const exam = await this.dbService.query(`SELECT id FROM exams WHERE id = $1`, [examId]);
    if (!exam.length) throw new NotFoundException('Imtihon topilmadi');

    await this.dbService.query(`
      UPDATE questions 
      SET status = 'approved' 
      WHERE id IN (SELECT question_id FROM exam_questions WHERE exam_id = $1)
      AND status = 'draft'
    `, [examId]);

    // Update exam status if it was pending
    await this.dbService.query(`UPDATE exams SET status = 'published' WHERE id = $1`, [examId]);

    this.socketsGateway.emitToAll('exam_approved', { examId });
    return { success: true, message: 'Barcha savollar tasdiqlandi va imtihon e\'lon qilindi' };
  }

  async generateAiExam(examId: string, lessonId: string, topic: string, level: string, count: number, teacherId: string) {
    const exam = await this.dbService.query(`SELECT id, title, teacher_id FROM exams WHERE id = $1`, [examId]);
    if (!exam.length) throw new NotFoundException('Exam not found');

    const job = await this.queueService.addExamJob({
      examId,
      lessonId,
      topic,
      level: level as any,
      count,
      teacherId
    });

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
    return this.dbService.query(`
      SELECT 
        e.*, 
        c.name as course_name,
        e.duration_minutes as duration,
        (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) as questions_count,
        ea.status as attempt_status,
        ea.score,
        CASE 
          WHEN ea.status = 'submitted' THEN 'COMPLETED'
          WHEN ea.status = 'in_progress' THEN 'IN_PROGRESS'
          ELSE 'UPCOMING'
        END as status
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      JOIN groups g ON g.course_id = c.id
      JOIN group_students gs ON gs.group_id = g.id
      LEFT JOIN exam_attempts ea ON ea.exam_id = e.id AND ea.student_id = gs.student_id
      WHERE gs.student_id = $1
      AND e.status = 'published'
      AND e.deleted_at IS NULL
    `, [studentId]);
  }

  async startExamAttempt(examId: string, studentUserId: string) {
    const exam = await this.dbService.query(`SELECT id, time_limit FROM exams WHERE id = $1 AND status = 'published'`, [examId]);
    if (!exam.length) throw new NotFoundException('Exam not found or not published.');

    // 1. In this system, req.user.id for students matches students.id
    const studentId = studentUserId;

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

    const questions = await this.dbService.query(`
      SELECT q.id, q.text, q.options, q.level
      FROM questions q
      JOIN exam_questions eq ON eq.question_id = q.id
      WHERE eq.exam_id = $1
      ORDER BY q.id ASC
    `, [attempt[0].exam_id]);

    return questions;
  }

  async getAttemptAnswers(attemptId: string) {
    const answers = await this.dbService.query(`
      SELECT question_id, answer_payload
      FROM attempt_answers
      WHERE attempt_id = $1
    `, [attemptId]);

    // Return as a simple mapping
    return answers.reduce((acc, curr) => {
      acc[curr.question_id] = JSON.parse(curr.answer_payload);
      return acc;
    }, {});
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

    return this.dbService.query(`
      INSERT INTO attempt_answers (attempt_id, question_id, answer_payload)
      VALUES ($1, $2, $3)
      ON CONFLICT (attempt_id, question_id) DO UPDATE 
      SET answer_payload = EXCLUDED.answer_payload, answered_at = NOW()
    `, [attemptId, questionId, JSON.stringify(payload)]);
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
       const question = await this.dbService.query(`SELECT type, correct_answer FROM questions WHERE id = $1`, [ans.question_id]);
       if (!question.length) continue;
       
       let isCorrect = false;
       let points = 0;
       const qType = question[0].type;
       const qCorrect = question[0].correct_answer;
       const uPayload = ans.answer_payload;

       // Enhanced AI evaluation
       if (qType === 'multiple_choice') {
         isCorrect = String(uPayload) === String(qCorrect);
       } else if (qType === 'multi_select') {
         const pArr = Array.isArray(uPayload) ? uPayload : [];
         const cArr = Array.isArray(qCorrect) ? qCorrect : [];
         isCorrect = pArr.length === cArr.length && pArr.every(v => cArr.includes(v));
       } else if (qType === 'text') {
         const userText = String(uPayload).toLowerCase();
         const targetKey = String(qCorrect).toLowerCase().split(/[\s,.;]+/);
         const matches = targetKey.filter(w => w.length > 3 && userText.includes(w)).length;
         const relevance = matches / Math.max(targetKey.filter(w => w.length > 3).length, 1);
         isCorrect = relevance >= 0.5;
         points = Math.round(relevance * 10);
       } else if (qType === 'code') {
         const code = String(uPayload);
         // Check for key algorithmic keywords in LeetCode answers
         const keywords = ['function', 'return', 'const', 'let', 'for', 'while', 'if', 'Map', 'Set', 'stack'];
         const matchCount = keywords.filter(k => code.includes(k)).length;
         const structuralScore = (matchCount / keywords.length) * 100;
         isCorrect = structuralScore > 40;
         points = isCorrect ? 10 : 0;
       }

       if (isCorrect) correctCount++;
       
       await this.dbService.query(`
         UPDATE attempt_answers SET is_correct = $1, earned_points = $2 WHERE id = $3
       `, [isCorrect, points || (isCorrect ? 10 : 0), ans.id]);
    }

    const finalScore = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    const result = await this.dbService.query(`
      UPDATE exam_attempts 
      SET status = 'submitted', finished_at = NOW(), score = $1 
      WHERE id = $2 RETURNING *
    `, [finalScore, attemptId]);

    // Update the legacy exam_results table for CRM compatibility
    await this.dbService.query(`
       INSERT INTO exam_results (exam_id, student_id, score, submitted_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (exam_id, student_id) DO UPDATE SET score = EXCLUDED.score
    `, [exam_id, student_id, finalScore]);

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

    const details = await this.dbService.query(`
      SELECT aa.*, q.text as question_text, q.correct_answer, q.type as question_type
      FROM attempt_answers aa
      JOIN questions q ON aa.question_id = q.id
      WHERE aa.attempt_id = $1
    `, [attemptId]);

    const correct_count = details.filter(d => d.is_correct).length;
    const incorrect_count = details.length - correct_count;
    
    // Time calculation
    let time_taken = 0;
    if (attempt[0].finished_at && attempt[0].started_at) {
      time_taken = Math.floor((new Date(attempt[0].finished_at).getTime() - new Date(attempt[0].started_at).getTime()) / 1000);
    }

    return { 
      ...attempt[0], 
      details,
      correct_count,
      incorrect_count,
      total_questions: details.length,
      time_taken
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
      ORDER BY er.submitted_at DESC
    `, [studentId]);
  }
}
