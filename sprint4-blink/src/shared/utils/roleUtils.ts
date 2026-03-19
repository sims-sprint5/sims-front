export type AppRole = 'user' | 'admin' | 'superadmin';

function normalizeRoleValue(role: unknown): string | null {
  if (typeof role !== 'string') return null;
  const normalized = role
    .trim()
    .toLowerCase()
    // Make role comparisons resilient to: "Super Admin", "super-admin", "super_admin".
    .replace(/[\s_-]+/g, '');
  return normalized ? normalized : null;
}

export function isSuperAdminRole(role: unknown): boolean {
  const normalized = normalizeRoleValue(role);
  if (!normalized) return false;
  return (
    normalized === 'superadmin' ||
    normalized === 'superadministrator' ||
    normalized === 'superadministrador' ||
    normalized === 'superadministradora'
  );
}

export function isAdminRole(role: unknown): boolean {
  const normalized = normalizeRoleValue(role);
  if (!normalized) return false;
  return (
    normalized === 'admin' ||
    normalized === 'administrator' ||
    normalized === 'administrador' ||
    normalized === 'administradora' ||
    isSuperAdminRole(normalized)
  );
}

export function hasAllowedRole(userRole: unknown, allowedRoles: readonly string[]): boolean {
  if (!allowedRoles?.length) return true;

  const userNormalized = normalizeRoleValue(userRole);
  if (!userNormalized) return false;

  const allowedNormalized = allowedRoles
    .map((r) => normalizeRoleValue(r))
    .filter((r): r is string => !!r);

  // If route allows "admin", accept common admin synonyms.
  if (allowedNormalized.includes('admin') && isAdminRole(userNormalized)) {
    return true;
  }

  // If route allows "superadmin", accept only superadmin.
  if (allowedNormalized.includes('superadmin') && isSuperAdminRole(userNormalized)) {
    return true;
  }

  // If route allows "user", accept common user synonyms.
  if (
    allowedNormalized.includes('user') &&
    (userNormalized === 'user' || userNormalized === 'usuario' || userNormalized === 'usuari')
  ) {
    return true;
  }

  return allowedNormalized.includes(userNormalized);
}
