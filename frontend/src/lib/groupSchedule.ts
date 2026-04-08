/**
 * Guruh jadvali matnidan hafta kunlari (0 = yakshanba … 6 = shanba, Date.getDay()).
 * Bo'sh qaytsa — cheklov yo'q (har kuni davomat mumkin).
 */
export function lessonWeekdaysFromSchedule(schedule: string | null | undefined): number[] | null {
  if (!schedule?.trim()) return null;
  const beforeParen = schedule.split('(')[0];
  const parts = beforeParen.split(/[,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  const found = new Set<number>();
  const map: [string, number][] = [
    ['dushanba', 1],
    ['seshanba', 2],
    ['chorshanba', 3],
    ['payshanba', 4],
    ['juma', 5],
    ['shanba', 6],
    ['yakshanba', 0],
    ['du', 1],
    ['se', 2],
    ['chor', 3],
    ['pay', 4],
    ['ju', 5],
    ['sha', 6],
    ['yak', 0],
  ];
  for (const raw of parts) {
    const t = raw.replace(/\.$/, '').trim();
    let hit = false;
    for (const [key, day] of map) {
      if (t === key) {
        found.add(day);
        hit = true;
        break;
      }
    }
    if (hit) continue;
    for (const [key, day] of map) {
      if (key.length >= 4 && t.startsWith(key)) {
        found.add(day);
        break;
      }
    }
  }
  return found.size > 0 ? [...found] : null;
}

export function isGroupLessonDay(schedule: string | null | undefined, date: Date): boolean {
  const days = lessonWeekdaysFromSchedule(schedule);
  if (days === null) return true;
  return days.includes(date.getDay());
}
