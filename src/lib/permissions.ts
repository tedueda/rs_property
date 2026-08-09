import type { User, RoleKey } from '@/types'

export function getUserRoleKeys(user: User | null): RoleKey[] {
  if (!user) return []
  if (user.user_roles && user.user_roles.length > 0) {
    return user.user_roles
      .filter((ur) => ur.role)
      .map((ur) => ur.role!.role_key)
  }
  // Fallback to legacy role field
  const legacyMap: Record<string, RoleKey> = {
    super_admin: 'president',
    admin: 'accounting_manager',
    staff: 'payment_staff',
    viewer: 'viewer',
  }
  return [legacyMap[user.role] || 'viewer']
}

export function canEdit(user: User | null): boolean {
  const roles = getUserRoleKeys(user)
  return roles.includes('president') || roles.includes('accounting_manager')
}

export function canEditPayments(user: User | null): boolean {
  const roles = getUserRoleKeys(user)
  return roles.includes('president') || roles.includes('accounting_manager') || roles.includes('payment_staff')
}

export function canViewAll(user: User | null): boolean {
  const roles = getUserRoleKeys(user)
  return (
    roles.includes('president') ||
    roles.includes('accounting_manager') ||
    roles.includes('payment_staff') ||
    roles.includes('viewer')
  )
}

export function canEditExpenses(user: User | null): boolean {
  const roles = getUserRoleKeys(user)
  return roles.includes('president') || roles.includes('accounting_manager') || roles.includes('expense_staff')
}

export function canEditDocuments(user: User | null): boolean {
  const roles = getUserRoleKeys(user)
  return roles.includes('president') || roles.includes('accounting_manager') || roles.includes('payment_staff') || roles.includes('expense_staff')
}

export function isReadOnly(user: User | null): boolean {
  const roles = getUserRoleKeys(user)
  return roles.every((r) => r === 'viewer')
}
