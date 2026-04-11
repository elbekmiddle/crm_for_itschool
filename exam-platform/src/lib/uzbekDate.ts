/** Yakshanba … shanba (Date#getDay: 0 = yakshanba) */
const WEEKDAYS_UZ = [
  'yakshanba',
  'dushanba',
  'seshanba',
  'chorshanba',
  'payshanba',
  'juma',
  'shanba',
] as const;

const MONTHS_UZ = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentyabr',
  'oktyabr',
  'noyabr',
  'dekabr',
] as const;

/** "YYYY-MM-DD" yoki ISO — mahalliy kalendar kuni sifatida */
export function parseLessonLocalDate(input: string | Date): Date {
  if (input instanceof Date) return input;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(input).trim());
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    return new Date(y, mo - 1, d);
  }
  return new Date(input);
}

/** Masalan: shanba, 11-aprel */
export function formatUzbekWeekdayDayMonth(input: string | Date): string {
  const d = parseLessonLocalDate(input);
  const day = d.getDate();
  const month = MONTHS_UZ[d.getMonth()] ?? '';
  const wd = WEEKDAYS_UZ[d.getDay()] ?? '';
  return `${wd}, ${day}-${month}`;
}
