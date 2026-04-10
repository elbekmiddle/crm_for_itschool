/**
 * Ko‘p savollarda qavs ichidagi inglizcha tarjima qo‘shilgan.
 * Asosiy matn o‘zbekcha bo‘lsa, lotin harflari ustun bo‘lgan qavslarni olib tashlash.
 */
export function displayQuestionTextUz(raw: string | undefined | null): string {
  if (!raw) return '';
  let s = String(raw).trim();
  s = s.replace(/\s*\(([^)]{6,})\)/g, (_m, inner: string) => {
    const letters = (inner.match(/[A-Za-z]/g) || []).length;
    return letters > inner.length * 0.35 ? '' : `(${inner})`;
  });
  return s.replace(/\s{2,}/g, ' ').trim();
}
