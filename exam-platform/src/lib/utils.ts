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
