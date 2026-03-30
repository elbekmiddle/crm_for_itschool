// IT School CRM — Telegram Bot (standalone)
// Run: npm run start:bot
// Handles: verify codes, password reset, exam alerts, attendance alerts, general help

require('dotenv').config();
const { Pool } = require('pg');
const fetch = require('node-fetch');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const API_URL = `http://localhost:${process.env.PORT || 5001}/api/v1`;

// Simple Redis client via Upstash REST API
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'it_school_crm',
});

// ─── Redis helpers ───────────────────────────────────────────────────────────
async function redisGet(key) {
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const json = await res.json();
  return json.result;
}

async function redisSet(key, value, exSeconds = 300) {
  await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}/ex/${exSeconds}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
}

async function redisDel(key) {
  await fetch(`${REDIS_URL}/del/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
}

// ─── Telegram API helpers ────────────────────────────────────────────────────
async function sendMessage(chatId, text, extra = {}) {
  await fetch(`${BASE_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
  });
}

async function editMessage(chatId, messageId, text) {
  await fetch(`${BASE_URL}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML' }),
  });
}

// ─── DB helpers ──────────────────────────────────────────────────────────────
async function getStudentByChatId(chatId) {
  const r = await db.query(
    `SELECT id, first_name, last_name, phone, is_verified FROM students
     WHERE telegram_chat_id = $1 AND deleted_at IS NULL LIMIT 1`,
    [String(chatId)]
  );
  return r.rows[0] || null;
}

async function getStudentByPhone(phone) {
  const r = await db.query(
    `SELECT id, first_name, last_name, phone, telegram_chat_id, is_verified FROM students
     WHERE phone = $1 AND deleted_at IS NULL LIMIT 1`,
    [phone]
  );
  return r.rows[0] || null;
}

async function linkStudentTelegram(studentId, chatId, telegramUser) {
  await db.query(
    `UPDATE students
     SET telegram_chat_id     = $1,
         telegram_username    = $2,
         telegram_first_name  = $3,
         telegram_last_name   = $4,
         telegram_linked_at   = NOW(),
         updated_at           = NOW()
     WHERE id = $5`,
    [
      String(chatId),
      telegramUser?.username   || null,
      telegramUser?.first_name || null,
      telegramUser?.last_name  || null,
      studentId,
    ]
  );
  console.log(`[BOT] Linked student ${studentId} to Telegram @${telegramUser?.username || chatId}`);
}

// ─── State machine (per user, stored in Redis) ───────────────────────────────
const STATE_NONE    = 'none';
const STATE_LINKING = 'linking';  // waiting for phone number to link
const STATE_RESET   = 'reset';    // waiting for reset code + new password

// ─── Message handler ─────────────────────────────────────────────────────────
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text   = (msg.text || '').trim();
  const name   = msg.from?.first_name || 'Foydalanuvchi';

  console.log(`[BOT] Message from ${chatId} (${name}): ${text}`);

  const stateKey = `bot:state:${chatId}`;
  const state = (await redisGet(stateKey)) || STATE_NONE;

  // ─── /start ───────────────────────────────────────────────────────────────
  if (text === '/start') {
    const student = await getStudentByChatId(chatId);
    if (student) {
      await sendMessage(chatId,
        `👋 Salom, <b>${student.first_name}</b>!\n\n` +
        `Siz IT School platformasiga ulangan holdasiz.\n\n` +
        `📋 <b>Buyruqlar:</b>\n` +
        `/status — Hisob holati\n` +
        `/reset — Parolni tiklash\n` +
        `/help — Yordam`
      );
    } else {
      await sendMessage(chatId,
        `👋 Salom, <b>${name}</b>! IT School Telegram Botiga xush kelibsiz.\n\n` +
        `📱 Hisobingizni ulash uchun telefon raqamingizni yuboring:\n` +
        `Misol: <code>+998901234567</code>\n\n` +
        `Bu raqam IT School'dagi ro'yxatingizda bo'lishi kerak.`,
        {
          reply_markup: {
            keyboard: [[{ text: '📱 Raqamimni yuborish', request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          }
        }
      );
      await redisSet(stateKey, STATE_LINKING, 300);
    }
    return;
  }

  // ─── /help ────────────────────────────────────────────────────────────────
  if (text === '/help') {
    await sendMessage(chatId,
      `📚 <b>IT School Bot — Yordam</b>\n\n` +
      `/start — Botni boshlash / hisob ulash\n` +
      `/status — O'quvchi holatini ko'rish\n` +
      `/reset — Parol tiklash kodi olish\n` +
      `/help — Ushbu yordam xabari\n\n` +
      `❓ Muammo bo'lsa administrator bilan bog'laning.`
    );
    return;
  }

  // ─── /status ──────────────────────────────────────────────────────────────
  if (text === '/status') {
    const student = await getStudentByChatId(chatId);
    if (!student) {
      await sendMessage(chatId, '❌ Hisobingiz ulanmagan. /start buyrug\'ini yuboring.');
      return;
    }
    const verified = student.is_verified ? '✅ Tasdiqlangan' : '⏳ Tasdiqlanmagan';
    await sendMessage(chatId,
      `👤 <b>Hisob holati</b>\n\n` +
      `Ism: ${student.first_name} ${student.last_name}\n` +
      `📞 Telefon: ${student.phone}\n` +
      `🔐 Holat: ${verified}\n\n` +
      `Parolni tiklash uchun /reset buyrug'ini yuboring.`
    );
    return;
  }

  // ─── /reset (password reset) ──────────────────────────────────────────────
  if (text === '/reset') {
    const student = await getStudentByChatId(chatId);
    if (!student) {
      await sendMessage(chatId, '❌ Hisobingiz ulanmagan. /start buyrug\'ini yuboring.');
      return;
    }
    // Generate 6-digit reset code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await redisSet(`verify:${student.phone}`, code, 300);
    await redisSet(stateKey, STATE_RESET, 300);
    await sendMessage(chatId,
      `🔐 <b>Parol tiklash kodi:</b>\n\n` +
      `<b><code>${code}</code></b>\n\n` +
      `⏰ Kod 5 daqiqa davomida amal qiladi.\n` +
      `❗ Ushbu kodni hech kimga bermang!\n\n` +
      `Bu kodni Exam Platform'da kiriting va yangi parol yarating.`
    );
    return;
  }

  // ─── Handle contact (phone number sharing) ────────────────────────────────
  if (msg.contact) {
    const phone = msg.contact.phone_number.replace(/\D/g, '');
    const fullPhone = phone.startsWith('998') ? `+${phone}` : (phone.startsWith('+') ? phone : `+${phone}`);
    
    const student = await getStudentByPhone(fullPhone);
    if (!student) {
      await sendMessage(chatId,
        `❌ Bu raqam (<code>${fullPhone}</code>) tizimda topilmadi.\n\n` +
        `Administrator bilan bog'laning yoki boshqa raqam sinab ko'ring.`,
        { reply_markup: { remove_keyboard: true } }
      );
      return;
    }

    // Link telegram_chat_id + full user data to student
    await linkStudentTelegram(student.id, chatId, msg.from);
    await redisDel(stateKey);

    // Send verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await redisSet(`verify:${fullPhone}`, code, 300);

    await sendMessage(chatId,
      `✅ Hisobingiz ulandi!\n\n` +
      `👤 <b>${student.first_name} ${student.last_name}</b>\n` +
      (msg.from?.username ? `🔗 @${msg.from.username}\n` : '') +
      `\n🔐 <b>Tasdiqlash kodingiz:</b>\n<b><code>${code}</code></b>\n\n` +
      `⏰ Kod 5 daqiqa amal qiladi.\n` +
      `Exam Platform'da "Tasdiqlash" sahifasiga bu kodni kiriting.`,
      { reply_markup: { remove_keyboard: true } }
    );
    return;
  }

  // ─── Phone number typed as text ───────────────────────────────────────────
  if (state === STATE_LINKING && /^[\+]?[0-9\s\-]{9,15}$/.test(text)) {
    const fullPhone = text.replace(/\s/g, '').startsWith('+') ? text.replace(/\s/g, '') : `+${text.replace(/\s/g, '')}`;
    const student = await getStudentByPhone(fullPhone);
    if (!student) {
      await sendMessage(chatId, `❌ Bu raqam tizimda topilmadi.\n\nIltimos to'g'ri raqamni kiriting yoki admin bilan bog'laning.`);
      return;
    }
    // Save full Telegram user data
    await linkStudentTelegram(student.id, chatId, msg.from);
    await redisDel(stateKey);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await redisSet(`verify:${fullPhone}`, code, 300);
    await sendMessage(chatId,
      `✅ Ulandi! <b>${student.first_name}</b>\n` +
      (msg.from?.username ? `🔗 @${msg.from.username}\n` : '') +
      `\n🔐 Tasdiqlash kodi: <b><code>${code}</code></b>\n\n` +
      `⏰ 5 daqiqa amal qiladi.`
    );
    return;
  }

  // ─── Default ──────────────────────────────────────────────────────────────
  const student = await getStudentByChatId(chatId);
  if (student) {
    await sendMessage(chatId,
      `❓ Buyruq tushunilmadi.\n\n` +
      `/status — Holat\n/reset — Parol tiklash\n/help — Yordam`
    );
  } else {
    await sendMessage(chatId,
      `👋 Salom! /start buyrug'ini yuboring va hisobingizni ulang.`
    );
  }
}

// ─── Polling loop ─────────────────────────────────────────────────────────────
let offset = 0;

async function poll() {
  try {
    const res  = await fetch(`${BASE_URL}/getUpdates?offset=${offset}&timeout=30&allowed_updates=["message","callback_query"]`);
    const data = await res.json();

    if (!data.ok) {
      console.error('[BOT] getUpdates error:', data.description);
      return;
    }

    for (const update of data.result) {
      offset = update.update_id + 1;
      if (update.message) {
        await handleMessage(update.message).catch((e) =>
          console.error('[BOT] Handler error:', e.message)
        );
      }
    }
  } catch (e) {
    console.error('[BOT] Poll error:', e.message);
  }
  setTimeout(poll, 1000);
}

// ─── Public API: send notifications from backend ─────────────────────────────
// These exports are used when this file is required as a module
async function notifyExamAssigned(telegramChatId, studentName, examTitle, examDate) {
  if (!telegramChatId) return;
  await sendMessage(telegramChatId,
    `📝 <b>Yangi Imtihon!</b>\n\n` +
    `Salom, <b>${studentName}</b>!\n\n` +
    `📌 Imtihon: <b>${examTitle}</b>\n` +
    `📅 Sana: ${examDate || 'Tez orada'}\n\n` +
    `🚀 Exam Platform'ga kiring va tayyorlanishni boshlang!\n` +
    `🔗 http://localhost:5174`
  );
}

async function notifyAbsent(telegramChatId, studentName, courseName, lessonDate) {
  if (!telegramChatId) return;
  await sendMessage(telegramChatId,
    `⚠️ <b>Darsga kelmadingiz!</b>\n\n` +
    `Salom, <b>${studentName}</b>!\n\n` +
    `📚 Kurs: ${courseName}\n` +
    `📅 Sana: ${lessonDate}\n\n` +
    `Sababli bo'lmagan darslar soni ortib ketsa, sertifikatga ta'sir qilishi mumkin.\n` +
    `Muammo bo'lsa, o'qituvchi yoki menejer bilan bog'laning.`
  );
}

async function notifyPaymentDue(telegramChatId, studentName, amount, month) {
  if (!telegramChatId) return;
  await sendMessage(telegramChatId,
    `💳 <b>To'lov eslatmasi!</b>\n\n` +
    `Salom, <b>${studentName}</b>!\n\n` +
    `💰 ${month} oyi uchun to'lov: <b>${Number(amount).toLocaleString()} so'm</b>\n\n` +
    `Iltimos, imkon qadar to'lovni amalga oshiring.\n` +
    `❓ Savol uchun menejer bilan bog'laning.`
  );
}

async function notifyExamResult(telegramChatId, studentName, examTitle, score) {
  if (!telegramChatId) return;
  const emoji = score >= 80 ? '🏆' : score >= 50 ? '👍' : '📖';
  const comment = score >= 80 ? 'Ajoyib natija!' : score >= 50 ? 'Yaxshi harakat!' : 'Ko\'proq o\'rganing!';
  await sendMessage(telegramChatId,
    `${emoji} <b>Imtihon natijasi!</b>\n\n` +
    `Salom, <b>${studentName}</b>!\n\n` +
    `📝 ${examTitle}\n` +
    `🎯 Ball: <b>${score}%</b>\n\n` +
    `${comment}\n\n` +
    `Natijangizni ko'rish: http://localhost:5174/exams`
  );
}

// Export notification functions for use in backend services
module.exports = { notifyExamAssigned, notifyAbsent, notifyPaymentDue, notifyExamResult, sendMessage };

// ─── Start bot ────────────────────────────────────────────────────────────────
(async () => {
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not set in .env!');
    process.exit(1);
  }

  console.log('🤖 IT School Telegram Bot starting...');

  // Verify bot info
  try {
    const res  = await fetch(`${BASE_URL}/getMe`);
    const data = await res.json();
    if (data.ok) {
      console.log(`✅ Bot connected: @${data.result.username} (${data.result.first_name})`);
    }
  } catch (e) {
    console.error('❌ Cannot connect to Telegram API:', e.message);
  }

  // Set bot commands menu
  await fetch(`${BASE_URL}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commands: [
        { command: 'start',  description: 'Botni boshlash / hisob ulash' },
        { command: 'status', description: 'O\'quvchi holatini ko\'rish' },
        { command: 'reset',  description: 'Parol tiklash kodi olish' },
        { command: 'help',   description: 'Yordam' },
      ]
    })
  });

  console.log('📡 Polling for updates...');
  poll();
})();
