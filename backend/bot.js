// IT School CRM — Telegram Bot (standalone)
// Run: npm run start:bot
// Handles: verify codes, password reset, exam alerts, attendance alerts, general help

require('dotenv').config();
const { Pool } = require('pg');
const fetch = require('node-fetch');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const API_URL = (process.env.API_INTERNAL_URL || `http://127.0.0.1:${process.env.PORT || 5001}/api/v1`).replace(
  /\/$/,
  '',
);

/** Blog havolasi (ixtiyoriy). Kurslar bazadan (callback) ko‘rinadi. */
const LINK_BLOG = (process.env.TELEGRAM_MENU_BLOG_URL || '').trim();
const PUBLIC_WEB = (process.env.PUBLIC_WEB_URL || 'http://localhost:5173').replace(/\/$/, '');
/** Exam platform (Vite) — Telegram xabarlarida; PUBLIC_EXAM_PLATFORM_URL bo‘lmasa PUBLIC_WEB ishlatiladi */
const EXAM_PUBLIC_BASE = (process.env.PUBLIC_EXAM_PLATFORM_URL || process.env.PUBLIC_WEB_URL || 'http://localhost:5174').replace(
  /\/$/,
  '',
);

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

async function answerCallbackQuery(callbackQueryId, text) {
  const body = { callback_query_id: callbackQueryId };
  if (text) {
    body.text = text;
    body.show_alert = text.length > 180;
  }
  await fetch(`${BASE_URL}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Kurslar (bazadan), ixtiyoriy Blog URL, Tasdiqlash kodi */
function mainMenuInlineKeyboard() {
  const rows = [];
  rows.push([{ text: '📚 Kurslar', callback_data: 'list_courses' }]);
  if (LINK_BLOG) rows.push([{ text: '📰 Blog', url: LINK_BLOG }]);
  rows.push([{ text: '🔐 Tasdiqlash kodi', callback_data: 'verify_code' }]);
  return { inline_keyboard: rows };
}

async function editMessage(chatId, messageId, text, extra = {}) {
  await fetch(`${BASE_URL}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', ...extra }),
  });
}

function escapeHtmlBot(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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

/** Normalize to digits only (Telegram contact vs DB formats). */
function phoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function normalizeUzPhoneDigits(phone) {
  let d = phoneDigits(phone);
  if (d.length === 9) d = '998' + d;
  return d;
}

/** Nest `POST /auth/send-verify-code` — bitta manba (Redis kalit + Telegram xabari) */
async function requestVerifyCodeViaApi(phoneE164) {
  const res = await fetch(`${API_URL}/auth/send-verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phoneE164 }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`send-verify-code ${res.status}: ${txt}`);
  }
}

async function getStudentByPhone(phone) {
  const digits = normalizeUzPhoneDigits(phone);
  if (!digits || digits.length < 11) return null;
  const r = await db.query(
    `SELECT id, first_name, last_name, phone, telegram_chat_id, is_verified FROM students
     WHERE deleted_at IS NULL
       AND regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = $1
     LIMIT 1`,
    [digits]
  );
  return r.rows[0] || null;
}

async function linkStudentTelegram(studentId, chatId, telegramUser) {
  await db.query(`UPDATE students SET telegram_chat_id = $1 WHERE id = $2`, [
    String(chatId),
    studentId,
  ]);
  console.log(
    `[BOT] Linked student ${studentId} to Telegram chat ${chatId}` +
      (telegramUser?.username ? ` (@${telegramUser.username})` : '')
  );
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
      await sendMessage(
        chatId,
        `👋 Salom, <b>${student.first_name}</b>!\n\n` +
          `🏫 <b>IT School o'quv markazining rasmiy botiga xush kelibsiz!</b>\n\n` +
          `Quyidagi menyudan kerakli bo'limni tanlang.\n\n` +
          `📋 <b>Buyruqlar:</b> /status · /reset · /help`,
        { reply_markup: mainMenuInlineKeyboard() }
      );
    } else {
      await sendMessage(
        chatId,
          `🏫 <b>IT School o'quv markazining rasmiy botiga xush kelibsiz!</b>\n\n` +
          `Quyidagi menyudan kerakli bo'limni tanlang: kurslar, blog yoki <b>«Tasdiqlash kodi»</b> — ` +
          `unda telefon kontaktingizni yuborasiz va tizim sizga 6 xonali kod beradi (CRM / Exam login).\n\n` +
          `🌐 Veb: <code>${PUBLIC_WEB}</code>`,
        { reply_markup: mainMenuInlineKeyboard() }
      );
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
    const digits = normalizeUzPhoneDigits(student.phone);
    const fullPhone = `+${digits}`;
    try {
      await requestVerifyCodeViaApi(fullPhone);
    } catch (e) {
      await sendMessage(chatId, `❌ Kod yuborilmadi: ${escapeHtmlBot(e.message)}. Keyinroq urinib ko‘ring yoki admin bilan bog‘laning.`);
      return;
    }
    await redisSet(stateKey, STATE_RESET, 300);
    await sendMessage(chatId,
      `🔐 <b>Tasdiqlash kodi</b> CRM orqali yuborildi.\n\n` +
      `Telegram yoki SMS/CRM xabaridagi 6 raqamli kodni Exam Platform'da kiriting va yangi parol yarating.\n\n` +
      `⏰ Kod 5 daqiqa davomida amal qiladi.`
    );
    return;
  }

  // ─── Handle contact (phone number sharing) ────────────────────────────────
  if (msg.contact) {
    const digits = normalizeUzPhoneDigits(msg.contact.phone_number);
    const fullPhone = digits.startsWith('998') ? `+${digits}` : `+${digits}`;

    const student = await getStudentByPhone(digits);
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

    try {
      await requestVerifyCodeViaApi(fullPhone);
    } catch (e) {
      await sendMessage(
        chatId,
        `✅ Ulandi, lekin kod yuborilmadi: ${escapeHtmlBot(e.message)}`,
        { reply_markup: { remove_keyboard: true } },
      );
      return;
    }

    await sendMessage(chatId,
      `✅ Hisobingiz ulandi!\n\n` +
      `👤 <b>${student.first_name} ${student.last_name}</b>\n` +
      `🆔 ID: <code>${student.id}</code>\n` +
      (msg.from?.username ? `🔗 @${msg.from.username}\n` : '') +
      `\n🔐 <b>Tasdiqlash kodi</b> CRM xabari orqali yuborildi.\n\n` +
      `⏰ Kod 5 daqiqa amal qiladi.\n` +
      `Exam Platform'da "Tasdiqlash" sahifasiga kodni kiriting.`,
      { reply_markup: { remove_keyboard: true } }
    );
    return;
  }

  // ─── Phone number typed as text ───────────────────────────────────────────
  if (state === STATE_LINKING && /^[\+]?[0-9\s\-]{9,15}$/.test(text)) {
    const raw = text.replace(/\s/g, '');
    const digits = normalizeUzPhoneDigits(raw.startsWith('+') ? raw : `+${raw}`);
    const fullPhone = digits.startsWith('998') ? `+${digits}` : `+${digits}`;
    const student = await getStudentByPhone(digits);
    if (!student) {
      await sendMessage(chatId, `❌ Bu raqam tizimda topilmadi.\n\nIltimos to'g'ri raqamni kiriting yoki admin bilan bog'laning.`);
      return;
    }
    // Save full Telegram user data
    await linkStudentTelegram(student.id, chatId, msg.from);
    await redisDel(stateKey);
    try {
      await requestVerifyCodeViaApi(fullPhone);
    } catch (e) {
      await sendMessage(chatId, `✅ Ulandi, lekin kod yuborilmadi: ${escapeHtmlBot(e.message)}`);
      return;
    }
    await sendMessage(chatId,
      `✅ Ulandi! <b>${student.first_name}</b>\n` +
      (msg.from?.username ? `🔗 @${msg.from.username}\n` : '') +
      `\n🔐 Tasdiqlash kodi CRM xabari orqali yuborildi.\n\n` +
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

// ─── Inline tugma: «Tasdiqlash kodi» → kontakt so‘rash ─────────────────────────
async function handleCallback(query) {
  const chatId = query.message?.chat?.id;
  const data = (query.data || '').trim();
  if (!chatId) return;

  if (data === 'verify_code') {
    const already = await getStudentByChatId(chatId);
    if (already) {
      await answerCallbackQuery(query.id, 'Hisob allaqachon ulangan');
      await sendMessage(
        chatId,
        '✅ Bu Telegram allaqachon talaba hisobiga ulangan.\n\n/status yoki /help'
      );
      return;
    }
  }

  if (data === 'list_courses') {
    await answerCallbackQuery(query.id, '');
    const qm = query.message;
    const mid = qm?.message_id;
    if (!mid) return;
    const res = await db.query(
      `SELECT id, name FROM courses WHERE deleted_at IS NULL ORDER BY name ASC NULLS LAST LIMIT 35`
    );
    if (!res.rows.length) {
      await editMessage(chatId, mid, '📚 Hozircha kurslar ro\'yxati bo\'sh.', {
        reply_markup: { inline_keyboard: [[{ text: '🔙 Orqaga', callback_data: 'menu_home' }]] },
      });
      return;
    }
    const rowsKb = [];
    for (const c of res.rows) {
      rowsKb.push([{ text: (c.name || 'Kurs').slice(0, 58), callback_data: `CRS|${c.id}` }]);
    }
    rowsKb.push([{ text: '🔙 Orqaga', callback_data: 'menu_home' }]);
    await editMessage(chatId, mid, '<b>Markazimiz kurslari</b> (faqat ma\'lumot):', {
      reply_markup: { inline_keyboard: rowsKb },
    });
    return;
  }

  if (data === 'menu_home') {
    await answerCallbackQuery(query.id, '');
    const qm = query.message;
    const mid = qm?.message_id;
    if (!mid) return;
    await editMessage(
      chatId,
      mid,
      `🏫 <b>IT School</b> — bosh menyu\n\n🌐 <code>${PUBLIC_WEB}</code>`,
      { reply_markup: mainMenuInlineKeyboard() }
    );
    return;
  }

  if (data && data.startsWith('CRS|')) {
    await answerCallbackQuery(query.id, '');
    const id = data.split('|')[1];
    const qm = query.message;
    const mid = qm?.message_id;
    if (!mid) return;
    const r = await db.query(
      `SELECT name, COALESCE(description,'') AS description FROM courses WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (!r.rows.length) return;
    const c = r.rows[0];
    const body = `📚 <b>${escapeHtmlBot(c.name)}</b>\n\n${escapeHtmlBot((c.description || '').trim() || "Qo‘shimcha tavsif yo‘q.")}`;
    await editMessage(chatId, mid, body, {
      reply_markup: { inline_keyboard: [[{ text: '🔙 Kurslar', callback_data: 'list_courses' }]] },
    });
    return;
  }

  await answerCallbackQuery(query.id, data === 'verify_code' ? 'Kontaktingizni yuboring' : '');

  if (data === 'verify_code') {
    const stateKey = `bot:state:${chatId}`;
    await redisSet(stateKey, STATE_LINKING, 600);
    await sendMessage(
      chatId,
      `🔐 <b>Tasdiqlash kodi</b>\n\n` +
        `Telefon raqamingiz IT School bazasidagi bilan mos kelishi kerak.\n` +
        `Pastdagi tugma orqali kontaktingizni yuboring yoki raqamni matn bilan yozing:`,
      {
        reply_markup: {
          keyboard: [[{ text: '📱 Raqamimni yuborish', request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
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
      if (update.callback_query) {
        await handleCallback(update.callback_query).catch((e) =>
          console.error('[BOT] Callback error:', e.message)
        );
      } else if (update.message) {
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
    `🔗 ${EXAM_PUBLIC_BASE}`
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
    `Natijangizni ko'rish: ${EXAM_PUBLIC_BASE}/exams`
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
