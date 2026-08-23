import { RoleName } from '../../database/entities/role-name.enum';

export const LEGACY_ROLE_ALIASES: Record<string, RoleName> = {
  ROLE_ADMIN: RoleName.ROLE_COMPANY_ADMIN
};

export const CONTRACT_ROLES: RoleName[] = [
  RoleName.ROLE_SUPER_ADMIN,
  RoleName.ROLE_COMPANY_ADMIN,
  RoleName.ROLE_RRHH,
  RoleName.ROLE_MANAGER,
  RoleName.ROLE_USER,
  RoleName.ROLE_AUDITOR,
  RoleName.ROLE_WORKFORCE_REPRESENTATIVE
];

export const ACTIVE_ACCESS_ROLES: RoleName[] = [
  RoleName.ROLE_SUPER_ADMIN,
  RoleName.ROLE_COMPANY_ADMIN,
  RoleName.ROLE_RRHH,
  RoleName.ROLE_MANAGER,
  RoleName.ROLE_USER
];

export const COMPANY_PRIVILEGED_ROLES: RoleName[] = [
  RoleName.ROLE_SUPER_ADMIN,
  RoleName.ROLE_COMPANY_ADMIN,
  RoleName.ROLE_RRHH
];

export function normalizeRoleName(role: string): RoleName | string {
  return LEGACY_ROLE_ALIASES[role] ?? role;
}

export function normalizeRoleNames(roles: readonly string[] | undefined | null): RoleName[] {
  if (!roles?.length) {
    return [];
  }

  return [...new Set(roles.map((role) => normalizeRoleName(role)))] as RoleName[];
}

export function hasAnyRole(roles: readonly string[] | undefined | null, expected: readonly RoleName[]) {
  const normalized = normalizeRoleNames(roles);
  return expected.some((role) => normalized.includes(role));
}
