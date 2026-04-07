/** Strip placeholder / junk tokens from names (e.g. "Admin-Tsystem"). */
const JUNK = /\b(system|tsystem|crm|admin[-\s]?t?system)\b/gi;

export function formatPersonName(
  first?: string | null,
  last?: string | null,
  fallbackEmail?: string | null,
): string {
  let fn = (first || '').replace(JUNK, '').trim();
  let ln = (last || '').replace(JUNK, '').trim();
  const name = `${fn} ${ln}`.trim();
  if (name) return name;
  if (fallbackEmail) return fallbackEmail.split('@')[0] || '—';
  return '—';
}

export function formatInitials(
  first?: string | null,
  last?: string | null,
  email?: string | null,
): string {
  const n = formatPersonName(first, last, email);
  if (n === '—') return '?';
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0][0] || '?').toUpperCase();
}
