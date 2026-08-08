import { rolePermissions, type Permission, type Role } from "@/constants/permissions";

export type { Permission, Role };

export type AccessSubject = {
  role?: Role | null;
  permissions?: readonly Permission[];
};

/**
 * Stub de autorización frontend.
 * La autorización real deberá resolverse en backend.
 */
export function canAccess(
  subject: AccessSubject | null | undefined,
  permission: Permission,
): boolean {
  if (!subject) return false;

  if (subject.permissions?.includes(permission)) {
    return true;
  }

  if (!subject.role) return false;

  return rolePermissions[subject.role].includes(permission);
}
