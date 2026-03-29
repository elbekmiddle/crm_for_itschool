import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly botToken: string;
  private readonly adminChatId: string;
  private readonly logger = new Logger(TelegramService.name);

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.adminChatId = this.configService.get<string>('TELEGRAM_ADMIN_CHAT_ID');
  }

  async sendMessage(message: string, chatId?: string) {
    const targetChatId = chatId || this.adminChatId;
    if (!this.botToken || !targetChatId) {
      this.logger.warn('Telegram Bot Token or Chat ID not configured. Notification skipped.');
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
      this.logger.log('Telegram notification sent successfully.');
    } catch (error) {
      this.logger.error('Failed to send Telegram notification:', error);
    }
  }

  // Helper for specific events
  async notifyNewPayment(studentName: string, amount: number, course: string) {
    const text = `💰 <b>Yangi To'lov!</b>\n\n👤 Talaba: ${studentName}\n💵 Summa: ${amount.toLocaleString()} UZS\n📚 Kurs: ${course}`;
    await this.sendMessage(text);
  }

  async notifyDebtor(studentName: string, phone: string, group: string) {
    const text = `⚠️ <b>Qarzdorlik Aniqlandi!</b>\n\n👤 Talaba: ${studentName}\n📞 Tel: ${phone}\n👥 Guruh: ${group}\n\n<i>Iltimos, managerlar nazoratga olsin.</i>`;
    await this.sendMessage(text);
  }
}
