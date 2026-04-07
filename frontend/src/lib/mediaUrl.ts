/** Rasm URL — nisbiy yo‘llarni API origin bilan to‘ldiradi. */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const t = url.trim();
  if (!t) return undefined;
  if (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('data:')) return t;
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
  const base = raw.replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '') || 'http://localhost:5001';
  return `${base}${t.startsWith('/') ? t : `/${t}`}`;
}
