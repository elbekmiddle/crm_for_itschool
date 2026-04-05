import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DbService } from '../database/db.service';
import { TelegramService } from './telegram.service';
import { SocketsGateway } from '../../modules/sockets/sockets.gateway';
import { Bot, InlineKeyboard, session } from 'grammy';

@Injectable()
export class TelegramReceptionBot implements OnModuleInit {
  private bot: Bot<any>;
  private readonly logger = new Logger(TelegramReceptionBot.name);

  constructor(
     private configService: ConfigService,
     private db: DbService,
     private tgNotify: TelegramService,
     private socketsGateway: SocketsGateway
  ) {}

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) return;

    try {
        this.bot = new Bot(token);
        this.bot.use(session({ initial: () => ({ currentAction: null, data: {} }) }));
        
        const mainMenu = new InlineKeyboard()
          .text('📚 Kurslar', 'START|COURSE').text('💼 Vakansiyalar', 'START|VAC').row()
          .text('📝 Arizalarim', 'START|APPS').text('🏢 Markaz haqida', 'START|ABOUT').row()
          .text('📞 Aloqa', 'START|CONTACT').text('🌐 Blog', 'START|BLOG');

        this.bot.command('start', async (ctx) => {
          await ctx.reply(`<b>IT School</b> o'quv markazining rasmiy botiga xush kelibsiz!\n\nQuyidagi menyudan kerakli bo'limni tanlang:`, {
            parse_mode: 'HTML',
            reply_markup: mainMenu
          });
        });

        this.bot.on('callback_query:data', async (ctx) => {
          const data = ctx.callbackQuery.data;
          await ctx.answerCallbackQuery().catch(() => {});

          if (data === 'START|HOME') {
            await ctx.editMessageText(`Bosh menyu:`, { reply_markup: mainMenu }).catch(()=>{});
            return;
          }

          if (data === 'START|COURSE') {
            const courses = await this.db.query('SELECT * FROM courses');
            if (!courses.length) return ctx.editMessageText('Hozircha kurslar yoq.', { reply_markup: new InlineKeyboard().text('🔙 Orqaga', 'START|HOME') });
            const kb = new InlineKeyboard();
            courses.forEach(c => kb.text(c.name, `COURSE|OPEN|${c.id}`).row());
            kb.text('🔙 Orqaga', 'START|HOME');
            await ctx.editMessageText('Qaysi kurs haqida malumot kerak?', { reply_markup: kb }).catch(()=>{});
          }

          if (data.startsWith('COURSE|OPEN|')) {
            const id = data.split('|')[2];
            const course = await this.db.query('SELECT * FROM courses WHERE id=$1', [id]);
            if (!course.length) return;
            const c = course[0];
            const text = `📚 <b>${c.name}</b>\n\n${c.description || 'Malumot yoq'}\n💸 Narxi: ${c.price} so'm`;
            const kb = new InlineKeyboard()
               .text('✍️ Yozilish', `COURSE|ENROLL|${c.id}`).row()
               .text('🔙 Kurslar', 'START|COURSE');
            await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(()=>{});
          }

          if (data.startsWith('COURSE|ENROLL|')) {
             const id = data.split('|')[2];
             ctx.session.currentAction = 'ENROLL_NAME';
             ctx.session.data = { courseId: id };
             await ctx.reply('Iltimos, ism familiyangizni yuboring:');
          }

          if (data === 'START|VAC') {
            const vacs = await this.db.query('SELECT * FROM vacancies ORDER BY created_at DESC');
            if (!vacs.length) return ctx.editMessageText('Vakansiyalar topilmadi.', { reply_markup: new InlineKeyboard().text('🔙 Orqaga', 'START|HOME') }).catch(()=>{});
            const kb = new InlineKeyboard();
            vacs.forEach(v => kb.text(v.title, `VAC|OPEN|${v.id}`).row());
            kb.text('🔙 Orqaga', 'START|HOME');
            await ctx.editMessageText('Ochiq vakansiyalar:', { reply_markup: kb }).catch(()=>{});
          }

          if (data.startsWith('VAC|OPEN|')) {
             const id = data.split('|')[2];
             const val = await this.db.query('SELECT * FROM vacancies WHERE id=$1', [id]);
             if (!val.length) return;
             const v = val[0];
             const text = `💼 <b>${v.title}</b>\n\n${v.description}\n💸 Oylik: ${v.salary || 'Suhbat asosida'}`;
             const kb = new InlineKeyboard()
                .text('✅ Topshirish', `VAC|APPLY|${v.id}`).row()
                .text('🔙 Vakansiyalar', 'START|VAC');
             await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(()=>{});
          }

          if (data.startsWith('VAC|APPLY|')) {
             const id = data.split('|')[2];
             ctx.session.currentAction = 'VAC_NAME';
             ctx.session.data = { vacancyId: id };
             await ctx.reply('Iltimos, ismingizni yuboring:');
          }

          if (data === 'START|ABOUT') {
             await ctx.editMessageText(`<b>Biz haqimizda:</b>\n\nZamonaviy kasblarga qaratilgan eng so'nggi IT maktab!\nO'quv xonalari i7 noutbuklari bilan jihozlangan. O'quvchilar real loyihalarda amaliyot o'taydi.`, { parse_mode: 'HTML', reply_markup: new InlineKeyboard().text('🔙 Bosh sahifa', 'START|HOME') }).catch(()=>{});
          }

          if (data === 'START|CONTACT') {
             await ctx.editMessageText(`<b>Aloqa markazi:</b>\n\n📞 +998 90 123 45 67\n📨 @exam_platform_admin\n📍 Manzil: Toshkent sh.`, { parse_mode: 'HTML', reply_markup: new InlineKeyboard().text('🔙 Bosh sahifa', 'START|HOME') }).catch(()=>{});
          }

          if (data === 'START|BLOG') {
             await ctx.editMessageText(`<b>Kanalimiz haqida ma'lumotlar:</b>\n\n👉 https://blog.itschool.uz`, { parse_mode: 'HTML', reply_markup: new InlineKeyboard().text('🔙 Bosh sahifa', 'START|HOME') }).catch(()=>{});
          }

          if (data === 'START|APPS') {
             await ctx.answerCallbackQuery('Bu funksiyangiz tez orada ochiladi!');
          }
        });

        this.bot.on('message:text', async (ctx) => {
           const session = ctx.session;
           if (!session.currentAction || ctx.message.text.startsWith('/')) return;

           if (session.currentAction === 'ENROLL_NAME') {
              session.data.name = ctx.message.text;
              session.currentAction = 'ENROLL_PHONE';
              await ctx.reply('Rahmat! Telefon raqamingizni yuboring (+99890...):');
              return;
           }

           if (session.currentAction === 'ENROLL_PHONE') {
              session.data.phone = ctx.message.text;
              try {
                 const res = await this.db.query(`
                    INSERT INTO leads (first_name, phone, course_id, source)
                    VALUES ($1, $2, $3, 'telegram') RETURNING *
                 `, [session.data.name, session.data.phone, session.data.courseId]);
                 
                 this.socketsGateway.emitToAll('new_lead', res[0]);
                 const c = await this.db.query('SELECT name FROM courses WHERE id=$1', [session.data.courseId]);
                 const msg = `🆕 <b>Telegramdan Yangi Ariza!</b>\n\n👤 Talaba: ${session.data.name}\n📞 Tel: ${session.data.phone}\n📚 Kurs: ${c[0]?.name}\nManba: Bot`;
                 await this.tgNotify.notifyAdmin(msg);

                 await ctx.reply('✅ Kursga arizangiz muvaffaqiyatli qabul qilindi. Tez orada aloqaga chiqamiz!', { reply_markup: { remove_keyboard: true } });
              } catch (e) {
                 await ctx.reply("Xatolik! Balki bu raqam allaqachon ro'yxatdan o'tgan?");
              }
              session.currentAction = null;
              return;
           }

           if (session.currentAction === 'VAC_NAME') {
              session.data.name = ctx.message.text;
              session.currentAction = 'VAC_PHONE';
              await ctx.reply('Telefon raqamingizni yuboring:');
              return;
           }

           if (session.currentAction === 'VAC_PHONE') {
              session.data.phone = ctx.message.text;
              session.currentAction = 'VAC_RESUME';
              await ctx.reply('Rezyumeingizga havolani (link) yuboring:');
              return;
           }

           if (session.currentAction === 'VAC_RESUME') {
              session.data.resume = ctx.message.text;
              try {
                 await this.db.query(`
                   INSERT INTO applications (vacancy_id, name, phone, resume_url)
                   VALUES ($1, $2, $3, $4)
                 `, [session.data.vacancyId, session.data.name, session.data.phone, session.data.resume]);
                 
                 const v = await this.db.query('SELECT title FROM vacancies WHERE id=$1', [session.data.vacancyId]);
                 const notifMsg = `🧑‍💻 <b>Telegramdan Yangi Kadidat!</b>\n\nIsm: ${session.data.name}\nTel: ${session.data.phone}\nVakansiya: ${v[0]?.title}\nRezyume: <a href="${session.data.resume}">Ko'rish</a>`;
                 await this.tgNotify.notifyAdmin(notifMsg);

                 await ctx.reply("✅ Arizangiz HR bo'limiga jo'natildi. Omad tilaymiz!");
              } catch(e) {
                 await ctx.reply('Xatolik yuz berdi!');
              }
              session.currentAction = null;
              return;
           }
        });

        this.bot.start().then(() => this.logger.log('Grammy Reception Bot Started')).catch(e => this.logger.error('Grammy start error:', e));
    } catch (err) {
        this.logger.error("Failed to init Grammy", err);
    }
  }
}
