/** Default CRM home URL for staff roles (after login or when fixing generic /dashboard). */
export function getStaffHomePath(role: string | undefined): string | undefined {
  switch (role) {
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    case 'MANAGER':
      return '/manager/dashboard';
    case 'TEACHER':
      return '/teacher/dashboard';
    default:
      return undefined;
  }
}
