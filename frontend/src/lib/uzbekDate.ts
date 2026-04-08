/** Masalan: 9-aprel, 2026-yil */
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

export function formatUzbekDayMonthYear(d: Date): string {
  const day = d.getDate();
  const m = MONTHS_UZ[d.getMonth()] ?? '';
  const y = d.getFullYear();
  return `${day}-${m}, ${y}-yil`;
}
