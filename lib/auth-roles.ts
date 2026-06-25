export const ADMIN_ROLES = ['ADMIN SYSTEM', 'HSE ADMIN', 'MASTER USER', 'ADMIN']

export function isAdminRole(role: string, email?: string): boolean {
  if (email === 'xom-it-admin@xomoman.com') return true
  return ADMIN_ROLES.includes((role ?? '').toUpperCase())
}
