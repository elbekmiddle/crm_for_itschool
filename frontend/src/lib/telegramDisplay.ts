/** Telegram badge: real @username, else ism familiya, else "Ulangan" (numeric id ko‘rsatilmaydi). */
export function formatTelegramLabel(student: {
  telegram_chat_id?: string | null;
  telegram_username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}): string | null {
  if (!student.telegram_chat_id) return null;
  const raw = (student.telegram_username || '').trim().replace(/^@/, '');
  if (raw && !/^\d+$/.test(raw)) {
    return `@${raw}`;
  }
  const name = `${student.first_name || ''} ${student.last_name || ''}`.trim();
  if (name) return name;
  return 'Ulangan';
}

/** Brauzer / Telegram ilovasida chatni ochish (username bo‘lsa t.me, aks holda tg://). */
export function telegramOpenHref(student: {
  telegram_chat_id?: string | null;
  telegram_username?: string | null;
}): string | null {
  if (!student.telegram_chat_id) return null;
  const raw = (student.telegram_username || '').trim().replace(/^@/, '');
  if (raw && !/^\d+$/.test(raw)) {
    return `https://t.me/${encodeURIComponent(raw)}`;
  }
  return `tg://user?id=${encodeURIComponent(String(student.telegram_chat_id))}`;
}

type TelegramStudent = {
  telegram_chat_id?: string | null;
  telegram_username?: string | null;
};

/**
 * Telegramni ochish: https:// — yangi tabda; tg:// — joriy oynada (yangi tabda emas — brauzer Google qidiruviga otmaydi).
 */
export function openTelegramChat(student: TelegramStudent): void {
  const href = telegramOpenHref(student);
  if (!href) return;
  if (href.startsWith('https://') || href.startsWith('http://')) {
    window.open(href, '_blank', 'noopener,noreferrer');
    return;
  }
  window.location.assign(href);
}
