import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Bo‘sh `id` lar `??` bilan o‘tib ketmasligi uchun (React key va radio guruhlari uchun) */
export function stableOptionId(raw: unknown, index: number): string {
  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    return String(raw);
  }
  return String(index + 1);
}

const OY_NOMLARI_UZ = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
] as const;

/** Backend `2026 M04` yoki `YYYY-MM` — faqat oy davri (kun yo‘q) */
function formatPaymentPeriodMonthOnly(monthRaw: unknown): string {
  const s = monthRaw != null ? String(monthRaw).trim() : '';
  const yM = s.match(/^(\d{4})\s*M0?(\d{1,2})$/i);
  if (yM) {
    const y = yM[1];
    const idx = Math.min(12, Math.max(1, parseInt(yM[2], 10))) - 1;
    return `${OY_NOMLARI_UZ[idx]} ${y}`;
  }
  const isoMonth = s.match(/^(\d{4})-(\d{2})(?:-|$)/);
  if (isoMonth) {
    const y = isoMonth[1];
    const idx = Math.min(11, Math.max(0, parseInt(isoMonth[2], 10) - 1));
    return `${OY_NOMLARI_UZ[idx]} ${y}`;
  }
  if (s) return s;
  return '';
}

function formatUzCalendarDate(ts: string): string | null {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getDate()} ${OY_NOMLARI_UZ[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * To‘lov sanasi: `paid_at` (yoki `created_at`) bo‘lsa — **kun + oy + yil** (masalan `4 Aprel 2026`).
 * Aks holda `month` maydonidan faqat oy davri.
 */
export function formatPaymentDisplayUz(input: {
  month?: unknown;
  paid_at?: string | null;
  created_at?: string | null;
}): string {
  const ts = input.paid_at || input.created_at;
  if (ts) {
    const full = formatUzCalendarDate(ts);
    if (full) return full;
  }
  const period = formatPaymentPeriodMonthOnly(input.month);
  if (period) return period;
  if (input.created_at) {
    const fallback = formatUzCalendarDate(input.created_at);
    if (fallback) return fallback;
  }
  return '';
}

const TOLOV_USULI_UZ: Record<string, string> = {
  cash: 'Naqd',
  naqd: 'Naqd',
  card: 'Karta',
  karta: 'Karta',
  bank: 'Bank',
  transfer: "O'tkazma",
  click: 'Click',
  payme: 'Payme',
};

export function formatPaymentMethodUz(methodRaw: unknown): string {
  const k = methodRaw != null ? String(methodRaw).trim().toLowerCase() : '';
  if (!k) return 'Naqd';
  return TOLOV_USULI_UZ[k] ?? methodRaw;
}
