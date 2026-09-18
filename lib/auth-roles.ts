export const ADMIN_ROLES = ['ADMIN SYSTEM', 'HSE ADMIN', 'MASTER USER', 'ADMIN', 'MANAGEMENT']
export const REVIEWER_ROLES = ['REVIEWER', 'APPROVER', 'MANAGEMENT']

export function isAdminRole(_role: string, _email?: string): boolean {
  return true
}

export function isReviewerRole(_role: string): boolean {
  return true
}
