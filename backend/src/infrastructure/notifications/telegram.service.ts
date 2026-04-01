import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DbService } from '../database/db.service';

@Injectable()
export class TelegramService {
  private readonly botToken: string;
  private readonly adminChatId: string;
  private readonly logger = new Logger(TelegramService.name);
  private readonly baseUrl: string;

  constructor(
    private configService: ConfigService,
    private dbService: DbService
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.adminChatId = this.configService.get<string>('TELEGRAM_ADMIN_CHAT_ID');
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  // --- Core Base Method ---
  async sendMessage(message: string, chatId?: string, studentId?: string, title?: string, replyMarkup?: any): Promise<boolean> {
    const targetChatId = chatId || this.adminChatId;
    if (!this.botToken || !targetChatId) return false;

    // Optional: Save notification for student platform history
    if (studentId) {
       this.dbService.query(
         `INSERT INTO notifications (student_id, title, message) VALUES ($1, $2, $3)`,
         [studentId, title || 'IT School', message.replace(/<[^>]*>?/gm, '')]
       ).catch(() => {});
    }

    try {
      const res = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: message,
          parse_mode: 'HTML',
          reply_markup: replyMarkup
        }),
      });
      return (await res.json()).ok;
    } catch (e) {
      this.logger.error('Telegram send failed:', e.message);
      return false;
    }
  }

  /** Notify Admin of new lead with interactive buttons */
  async notifyNewLead(lead: any): Promise<void> {
    const text = `🆕 <b>Yangi Ariza tushdi!</b>\n\n` +
      `👤 Ism: ${lead.first_name}\n` +
      `📞 Tel: ${lead.phone}\n` +
      `📚 Kurs: ${lead.course_id || 'Tanlanmagan'}\n` +
      `🔗 Manba: #${lead.source}\n\n` +
      `<i>Menejerlar diqqatiga: Qo'ng'iroq qilinib, converted statusiga olib o'tilsin.</i>`;
    
    // Callback buttons (repo-style integration)
    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '📞 Qo\'ng\'iroq qilindi', callback_data: `lead:call:${lead.id}` },
          { text: '✅ Qabul qilindi', callback_data: `lead:convert:${lead.id}` }
        ]
      ]
    };

    await this.sendMessage(text, this.adminChatId, null, null, replyMarkup);
  }

  /** Notify Teacher of AI-generated exam for review */
  async sendExamForReview(teacherId: string, teacherChatId: string, exam: any): Promise<void> {
    const crmUrl = `https://crm.itschool.uz/teacher/exams/review/${exam.id}`;
    const text = `🧠 <b>AI Imtihon tayyor!</b>\n\n` +
      `📌 Imtihon: <b>${exam.title}</b>\n` +
      `📝 Savollar: ${exam.question_count || 0}\n\n` +
      `Iltimos, savollarni ko'rib chiqing va tasdiqlang. Shundan so'ng talabalarga ko'rinadi.`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '👉 Ko\'rib chiqish (CRM)', url: crmUrl },
          { text: '✅ Hammasini tasdiqlash', callback_data: `exam:approve:${exam.id}` }
        ]
      ]
    };

    await this.sendMessage(text, teacherChatId, null, null, replyMarkup);
  }

  // --- Auth Verification ---
  async sendVerifyCode(chatId: string, code: string, firstName: string, studentId: string): Promise<void> {
    const text = `🔐 <b>IT School Tasdiqlash Kodi</b>\n\nSalom, <b>${firstName}</b>!\n\nSizning kirish kodingiz: <code>${code}</code>\n\nUni hech kimga bermang!`;
    await this.sendMessage(text, chatId, studentId, 'Tasdiqlash kodi');
  }

  async sendVerifyCodeToAdmin(firstName: string, phone: string, code: string, studentId: string): Promise<void> {
    const text = `🔔 <b>Admin diqqatiga!</b>\n\nO'quvchi <b>${firstName}</b> (${phone}) platformaga kirish uchun kod so'radi (ChatID yo'q).\n\nKod: <code>${code}</code>\n\nO'quvchiga yetkazib qo'ying.`;
    await this.sendMessage(text, this.adminChatId, studentId, 'Admin verifikatsiya xabari');
  }

  async sendWelcome(chatId: string, firstName: string, studentId: string): Promise<void> {
    const text = `🎉 <b>Muvaffaqiyatli ro'yxatdan o'tdingiz!</b>\n\nSalom, <b>${firstName}</b>!\n\nIT School platformasiga xush kelibsiz. Endi siz imtihonlarni topshirishingiz va darslarni kuzatishingiz mumkin.`;
    await this.sendMessage(text, chatId, studentId, 'Xush kelibsiz');
  }

  // --- Attendance & Classes ---
  async notifyAbsent(chatId: string, name: string, course: string, date: string, studentId: string): Promise<void> {
    const text = `⚠️ <b>Darsda qatnashmadingiz!</b>\n\n` +
      `O'quvchi: <b>${name}</b>\n` +
      `📚 Kurs: ${course}\n` +
      `📅 Sana: ${date}\n\n` +
      `Siz bugungi darsni qoldirdingiz. Sababini ustozga tushuntiring.`;
    await this.sendMessage(text, chatId, studentId, 'Davomat ogohlantirishi');
  }

  // --- Exams ---
  async notifyExamStarting(chatId: string, studentName: string, examTitle: string, studentId: string): Promise<void> {
    const text = `🚀 <b>Imtihon boshlandi!</b>\n\n` +
      `<b>${studentName}</b>, siz <b>${examTitle}</b> imtihonini boshladingiz.\n\n` +
      `Omad tilaymiz! Oynani tark etmang.`;
    await this.sendMessage(text, chatId, studentId, 'Imtihon boshlanishi');
  }

  async notifyExamResult(chatId: string, studentName: string, examTitle: string, score: number, studentId: string): Promise<void> {
    const emoji = score >= 80 ? '🏆' : score >= 50 ? '👍' : '📖';
    const text = `${emoji} <b>Imtihon Natijasi!</b>\n\n` +
      `Salom, <b>${studentName}</b>!\n\n` +
      `📝 ${examTitle}\n\n` +
      `🎯 Ball: <b>${score}%</b>\n\n` +
      `<i>Natijani batafsil ko'rish uchun students.itschool.uz’ga kiring.</i>`;
    
    await this.sendMessage(text, chatId, studentId, 'Imtihon natijasi');
  }

  // --- Payments ---
  async notifyPaymentDue(chatId: string, name: string, amount: number, month: string, studentId?: string): Promise<void> {
    const text = `💳 <b>To'lov vaqti keldi!</b>\n\n` +
      `O'quvchi: <b>${name}</b>\n` +
      `💰 To'lov: <b>${amount.toLocaleString()} so'm</b>\n` +
      `🗓 Oy: ${month}\n\n` +
      `Iltimos, o'quv markaziga kelib to'lovni amalga oshiring.`;
    await this.sendMessage(text, chatId, studentId, 'To\'lov haqida ogohlantirish');
  }

  async notifyPaymentAlert(chatId: string, name: string, amount: number, month: string): Promise<void> {
     await this.notifyPaymentDue(chatId, name, amount, month);
  }

  /** Notify admin about a debtor */
  async notifyDebtor(studentName: string, phone: string, group: string): Promise<void> {
    const text = `⚠️ <b>Qarzdorlik Aniqlandi!</b>\n\n👤 Talaba: ${studentName}\n📞 Tel: ${phone}\n👥 Guruh: ${group}\n\n<i>Iltimos, managerlar nazoratga olsin.</i>`;
    await this.sendMessage(text);
  }

  /** General admin notification */
  async notifyAdmin(message: string): Promise<void> {
    await this.sendMessage(`🔔 <b>Admin Xabari</b>\n\n${message}`);
  }
}
