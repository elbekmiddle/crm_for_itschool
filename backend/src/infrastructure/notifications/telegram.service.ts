import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly botToken: string;
  private readonly adminChatId: string;
  private readonly logger = new Logger(TelegramService.name);
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.adminChatId = this.configService.get<string>('TELEGRAM_ADMIN_CHAT_ID');
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  // ─── Core send ────────────────────────────────────────────────────────────
  async sendMessage(message: string, chatId?: string): Promise<boolean> {
    const targetChatId = chatId || this.adminChatId;
    if (!this.botToken || !targetChatId) {
      this.logger.warn('Telegram Bot Token or Chat ID not configured. Notification skipped.');
      return false;
    }
    try {
      const url = `${this.baseUrl}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
      const data: any = await res.json();
      if (!data.ok) {
        this.logger.warn(`Telegram API error: ${data.description} (chat_id: ${targetChatId})`);
        return false;
      }
      this.logger.log(`✅ Telegram sent to ${targetChatId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send Telegram notification:', error.message);
      return false;
    }
  }

  // ─── Auth / Verification ──────────────────────────────────────────────────

  /** Send verify/reset code to student */
  async sendVerifyCode(chatId: string, code: string, studentName: string): Promise<void> {
    await this.sendMessage(
      `🔐 <b>IT School Tasdiqlash Kodi</b>\n\n` +
      `Salom, <b>${studentName}</b>!\n\n` +
      `Sizning tasdiqlash kodingiz:\n\n` +
      `<b><code>${code}</code></b>\n\n` +
      `⏰ Kod 5 daqiqa ichida amal qiladi.\n` +
      `❗ Ushbu kodni hech kimga bermang.`,
      chatId,
    );
  }

  /** Fallback: send code to admin if student has no telegram_chat_id */
  async sendVerifyCodeToAdmin(studentName: string, phone: string, code: string): Promise<void> {
    await this.sendMessage(
      `📱 <b>Talaba tasdiqlash kodi</b>\n\n` +
      `👤 Talaba: <b>${studentName}</b>\n` +
      `📞 Telefon: ${phone}\n\n` +
      `🔐 Kod: <b><code>${code}</code></b>\n\n` +
      `<i>⚠️ Bu talabaning telegram_chat_id si yo'q — kodni SMS orqali yetkazing.</i>`,
    );
  }

  /** Welcome after first-time verification */
  async sendWelcome(chatId: string, studentName: string): Promise<void> {
    await this.sendMessage(
      `🎉 <b>Xush kelibsiz, ${studentName}!</b>\n\n` +
      `Siz IT School platformasiga muvaffaqiyatli ro'yxatdan o'tdingiz.\n\n` +
      `✅ Parolingiz saqlandi.\n\n` +
      `📱 Buyruqlar:\n/status — Holat\n/reset — Parol tiklash\n/help — Yordam\n\n` +
      `Omad! 🚀`,
      chatId,
    );
  }

  // ─── Exam Notifications ───────────────────────────────────────────────────

  /** Notify student that a new exam has been assigned to their group */
  async notifyExamAssigned(chatId: string, studentName: string, examTitle: string, examDate?: string): Promise<void> {
    await this.sendMessage(
      `📝 <b>Yangi Imtihon Tayinlandi!</b>\n\n` +
      `Salom, <b>${studentName}</b>!\n\n` +
      `📌 Imtihon: <b>${examTitle}</b>\n` +
      `📅 Sana: ${examDate || 'Tez orada'}\n\n` +
      `🚀 Exam Platform'ga kiring va tayyorlanishni boshlang!\n` +
      `🔗 Exam Platform orqali kirish uchun /start buyrug'ini yuboring.`,
      chatId,
    );
  }

  /** Notify student of their exam result */
  async notifyExamResult(chatId: string, studentName: string, examTitle: string, score: number): Promise<void> {
    const emoji = score >= 80 ? '🏆' : score >= 50 ? '👍' : '📖';
    const comment = score >= 80 ? 'Ajoyib natija!' : score >= 50 ? 'Yaxshi harakat!' : "Ko'proq o'rganing!";
    await this.sendMessage(
      `${emoji} <b>Imtihon Natijasi!</b>\n\n` +
      `Salom, <b>${studentName}</b>!\n\n` +
      `📝 ${examTitle}\n` +
      `🎯 Ball: <b>${score}%</b>\n\n` +
      `${comment}`,
      chatId,
    );
  }

  // ─── Attendance Notifications ─────────────────────────────────────────────

  /** Notify student they missed a lesson */
  async notifyAbsent(chatId: string, studentName: string, courseName: string, lessonDate: string): Promise<void> {
    await this.sendMessage(
      `⚠️ <b>Darsga kelmadingiz!</b>\n\n` +
      `Salom, <b>${studentName}</b>!\n\n` +
      `📚 Kurs: ${courseName}\n` +
      `📅 Sana: ${lessonDate}\n\n` +
      `Sababli bo'lmagan darslar ko'paysa, sertifikatga ta'sir qilishi mumkin.\n` +
      `Muammo bo'lsa, o'qituvchi yoki menejer bilan bog'laning.`,
      chatId,
    );
  }

  /** Notify parent about student absence */
  async notifyParentAbsent(parentChatId: string, studentName: string, courseName: string, lessonDate: string): Promise<void> {
    await this.sendMessage(
      `👨‍👩‍👦 <b>Farzandingiz darsga kelmadi</b>\n\n` +
      `👤 Talaba: <b>${studentName}</b>\n` +
      `📚 Kurs: ${courseName}\n` +
      `📅 Sana: ${lessonDate}\n\n` +
      `Iltimos, farzandingiz bilan gaplashing.`,
      parentChatId,
    );
  }

  // ─── Payment Notifications ────────────────────────────────────────────────

  /** Notify student about upcoming/overdue payment */
  async notifyPaymentDue(chatId: string, studentName: string, amount: number, month: string): Promise<void> {
    await this.sendMessage(
      `💳 <b>To'lov Eslatmasi!</b>\n\n` +
      `Salom, <b>${studentName}</b>!\n\n` +
      `💰 ${month} oyi uchun to'lov: <b>${Number(amount).toLocaleString()} so'm</b>\n\n` +
      `Iltimos, imkon qadar to'lovni amalga oshiring.\n` +
      `❓ Savol uchun menejer bilan bog'laning.`,
      chatId,
    );
  }

  /** Notify admin about new payment received */
  async notifyNewPayment(studentName: string, amount: number, course: string): Promise<void> {
    const text = `💰 <b>Yangi To'lov!</b>\n\n👤 Talaba: ${studentName}\n💵 Summa: ${amount.toLocaleString()} UZS\n📚 Kurs: ${course}`;
    await this.sendMessage(text);
  }

  /** Notify admin about a debtor */
  async notifyDebtor(studentName: string, phone: string, group: string): Promise<void> {
    const text = `⚠️ <b>Qarzdorlik Aniqlandi!</b>\n\n👤 Talaba: ${studentName}\n📞 Tel: ${phone}\n👥 Guruh: ${group}\n\n<i>Iltimos, managerlar nazoratga olsin.</i>`;
    await this.sendMessage(text);
  }

  // ─── Admin Alerts ─────────────────────────────────────────────────────────

  /** General admin notification */
  async notifyAdmin(message: string): Promise<void> {
    await this.sendMessage(`🔔 <b>Admin Xabari</b>\n\n${message}`);
  }
}
