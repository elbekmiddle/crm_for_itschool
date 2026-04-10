/** Eski token / DB qiymatlari: kichik harf, ko‘plik va hokazo */
export function normalizeRole(role: string | undefined | null): string {
  if (role == null) return '';
  const r = String(role).trim();
  if (!r) return '';
  const u = r.toUpperCase();
  if (u === 'STUDENTS') return 'STUDENT';
  return u;
}

/** Server-side permission sets by role (JWT payload yangilangan bo‘lmasa ham strategiya shu ro‘yxatdan foydalanadi). */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['*'],
  MANAGER: [
    'STUDENT_READ',
    'STUDENT_CREATE',
    'STUDENT_UPDATE',
    'STUDENT_ENROLL',
    'COURSE_READ',
    'GROUP_READ',
    'GROUP_UPDATE',
    'PAYMENT_READ',
    'PAYMENT_CREATE',
    'PAYMENT_UPDATE',
    'EXAM_PASS',
    'EXAM_READ',
    'ANALYTICS_VIEW',
  ],
  TEACHER: [
    'STUDENT_READ',
    'STUDENT_CREATE',
    'STUDENT_UPDATE',
    'STUDENT_ENROLL',
    'COURSE_READ',
    'GROUP_READ',
    'GROUP_CREATE',
    'GROUP_UPDATE',
    'ATTENDANCE_MARK',
    'ATTENDANCE_READ',
    'EXAM_MANAGE',
    'EXAM_PASS',
    'EXAM_READ',
    'PAYMENT_READ',
    'ANALYTICS_VIEW',
  ],
  STUDENT: [
    'STUDENT_READ',
    'EXAM_PASS',
    'EXAM_READ',
    'ATTENDANCE_READ',
    'PAYMENT_READ',
    'COURSE_READ',
  ],
};

export function permissionsForRole(role: string | undefined): string[] {
  const nr = normalizeRole(role);
  if (!nr) return [];
  return ROLE_PERMISSIONS[nr] ?? [];
}
