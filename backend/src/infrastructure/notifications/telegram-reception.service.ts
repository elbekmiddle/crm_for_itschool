import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DbService } from '../database/db.service';
import { RedisService } from '../redis/redis.service';
import { Bot, InlineKeyboard, session } from 'grammy';

function isTelegramPollingConflict(err: unknown): boolean {
  const e = err as { error_code?: number; message?: string; description?: string };
  if (e?.error_code === 409) return true;
  const s = `${e?.message ?? ''} ${e?.description ?? ''} ${String(err)}`;
  return s.includes('409') && (s.includes('Conflict') || s.includes('getUpdates') || s.includes('terminated by other'));
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

@Injectable()
export class TelegramReceptionBot implements OnModuleInit {
  private bot: Bot<any>;
  private readonly logger = new Logger(TelegramReceptionBot.name);

  constructor(
    private configService: ConfigService,
    private db: DbService,
    private redis: RedisService,
  ) {}

  private normalizeDigits(phone: string): string {
    let d = String(phone || '').replace(/\D/g, '');
    if (d.length === 9) d = '998' + d;
    return d;
  }

  private verifyRedisKey(digits: string): string {
    const d = String(digits || '').replace(/\D/g, '');
    return d ? `verify:+${d}` : 'verify:';
  }

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) return;

    const pollingFlag = this.configService.get<string>('TELEGRAM_RECEPTION_POLLING');
    if (pollingFlag === '0' || pollingFlag === 'false') {
      this.logger.log(
        'Telegram qabul boti: polling o‘chirilgan (TELEGRAM_RECEPTION_POLLING=false). Xabar yuborish (notify) baribir ishlaydi.',
      );
      return;
    }

    const blogUrl = (this.configService.get<string>('TELEGRAM_MENU_BLOG_URL') || '').trim();

    const mainMenu = () => {
      const kb = new InlineKeyboard().text('📚 Kurslar', 'MENU|COURSES').row();
      if (blogUrl) kb.url('📰 Blog', blogUrl).row();
      kb
        .text('🔐 Hisobni ulash / kod', 'MENU|VERIFY')
        .row()
        .text('🏢 Markaz haqida', 'MENU|ABOUT')
        .text('📞 Aloqa', 'MENU|CONTACT');
      return kb;
    };

    try {
      this.bot = new Bot(token);
      this.bot.use(session({ initial: () => ({}) }));

      this.bot.command('start', async (ctx) => {
        await ctx.reply(
          `<b>IT School</b> o'quv markazining rasmiy botiga xush kelibsiz!\n\n` +
            `📚 <b>Kurslar</b> — ro‘yxat bazadan (faqat ma'lumot).\n` +
            `🔐 <b>Hisobni ulash</b> — kontakt yuboring; raqam CRM dagi bilan mos bo‘lsa, login uchun kod beriladi.\n` +
            `📢 CRM va imtihon bildirishnomalari shu yerda ham ko‘rinadi.`,
          { parse_mode: 'HTML', reply_markup: mainMenu() },
        );
      });

      this.bot.on('callback_query:data', async (ctx) => {
        const data = ctx.callbackQuery.data;
        await ctx.answerCallbackQuery().catch(() => {});

        if (data === 'MENU|HOME') {
          await ctx.editMessageText(`Bosh menyu:`, { reply_markup: mainMenu(), parse_mode: 'HTML' }).catch(() => {});
          return;
        }

        if (data === 'MENU|COURSES') {
          const courses = await this.db.query<{ id: string; name: string }>(
            `SELECT id, name FROM courses WHERE deleted_at IS NULL ORDER BY name ASC NULLS LAST LIMIT 35`,
          );
          if (!courses.length) {
            await ctx
              .editMessageText(`Hozircha kurslar ro'yxati bo'sh.`, {
                reply_markup: new InlineKeyboard().text('🔙 Orqaga', 'MENU|HOME'),
              })
              .catch(() => {});
            return;
          }
          const kb = new InlineKeyboard();
          for (const c of courses) {
            const label = (c.name || 'Kurs').slice(0, 58);
            kb.text(label, `CRS|${c.id}`).row();
          }
          kb.text('🔙 Orqaga', 'MENU|HOME');
          await ctx
            .editMessageText(
              `<b>Markazimiz kurslari</b> (faqat ma'lumot — bu yerdan yozilish yo'q):`,
              { parse_mode: 'HTML', reply_markup: kb },
            )
            .catch(() => {});
          return;
        }

        if (data?.startsWith('CRS|')) {
          const id = data.split('|')[1];
          const rows = await this.db.query<{ name: string; description: string | null }>(
            `SELECT name, description FROM courses WHERE id = $1 AND deleted_at IS NULL`,
            [id],
          );
          if (!rows.length) return;
          const c = rows[0];
          const txt =
            `📚 <b>${escapeHtml(c.name)}</b>\n\n${escapeHtml((c.description || '').trim() || "Qo‘shimcha tavsif hozircha yo‘q.")}`;
          const kb = new InlineKeyboard().text('🔙 Kurslar', 'MENU|COURSES');
          await ctx.editMessageText(txt, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
          return;
        }

        if (data === 'MENU|VERIFY') {
          await ctx
            .editMessageText(
              `🔐 <b>Hisobni ulash</b>\n\n` +
                `Telefon CRM dagi talaba raqami bilan bir xil bo‘lishi kerak.\n` +
                `Keyingi xabarda kontaktingizni yuboring — kod shu yerga keladi.`,
              { parse_mode: 'HTML', reply_markup: new InlineKeyboard().text('🔙 Menyu', 'MENU|HOME') },
            )
            .catch(() => {});
          await ctx.reply('📱 Kontaktingizni yuboring:', {
            reply_markup: {
              keyboard: [[{ text: '📱 Raqamimni yuborish', request_contact: true }]],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          });
          return;
        }

        if (data === 'MENU|ABOUT') {
          await ctx
            .editMessageText(
              `<b>Markaz haqida</b>\n\n` +
                `Zamonaviy IT ta'lim — real loyihalar va amaliyot.`,
              { parse_mode: 'HTML', reply_markup: new InlineKeyboard().text('🔙 Orqaga', 'MENU|HOME') },
            )
            .catch(() => {});
          return;
        }

        if (data === 'MENU|CONTACT') {
          await ctx
            .editMessageText(
              `<b>Aloqa</b>\n\n` +
                `Savollar uchun markaz administratori yoki o‘qituvchingiz bilan bog‘laning.`,
              { parse_mode: 'HTML', reply_markup: new InlineKeyboard().text('🔙 Orqaga', 'MENU|HOME') },
            )
            .catch(() => {});
          return;
        }
      });

      this.bot.on('message:contact', async (ctx) => {
        const contact = ctx.message?.contact;
        if (!contact) return;
        const chatId = String(ctx.chat?.id);
        const digits = this.normalizeDigits(contact.phone_number);
        const rows = await this.db.query<{ id: string; first_name: string; last_name: string | null }>(
          `SELECT id, first_name, last_name FROM students
           WHERE deleted_at IS NULL
             AND regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = $1
           LIMIT 1`,
          [digits],
        );
        if (!rows.length) {
          await ctx.reply(`❌ Bu telefon raqam tizimda topilmadi. Administrator bilan bog‘laning.`, {
            reply_markup: { remove_keyboard: true },
          });
          return;
        }
        const st = rows[0];
        await this.db.query(`UPDATE students SET telegram_chat_id = $1 WHERE id = $2`, [chatId, st.id]);

        const code = String(Math.floor(100000 + Math.random() * 900000));
        const key = this.verifyRedisKey(digits);
        if (this.redis.isEnabled()) {
          await this.redis.set(key, code, { ex: 300 });
        }

        const redisHint = this.redis.isEnabled()
          ? ''
          : `\n\n⚠️ <i>Redis sozlanmagan bo‘lsa, CRM login kodi serverda saqlanmasligi mumkin — UPSTASH ni tekshiring.</i>`;

        await ctx.reply(
          `✅ Hisob ulandi!\n\n` +
            `👤 <b>${escapeHtml(st.first_name)} ${escapeHtml(st.last_name || '')}</b>\n\n` +
            `🔐 Tasdiqlash kodi: <code>${code}</code>\n\n` +
            `⏰ 5 daqiqa amal qiladi. CRM yoki Exam login sahifasiga kiriting.` +
            redisHint,
          { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } },
        );
      });

      this.bot
        .start()
        .then(() => this.logger.log('Grammy qabul boti polling bilan ishga tushdi'))
        .catch((e) => {
          if (isTelegramPollingConflict(e)) {
            this.logger.warn(
              'Telegram qabul boti: 409 — bu token bilan boshqa joyda getUpdates (polling) ishlayapti. ' +
                'Faqat bitta Nest yoki faqat `npm run start:bot` qoldiring, yoki TELEGRAM_RECEPTION_POLLING=false.',
            );
            return;
          }
          this.logger.error('Grammy qabul boti ishga tushmadi:', e);
        });
    } catch (err) {
      this.logger.error('Grammy qabul botini yaratishda xato:', err);
    }
  }
}
