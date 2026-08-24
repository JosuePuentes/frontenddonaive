/** Usuarios y sesión local — offline-first. */

import { DS_DEFAULT_ROLE_PERMISSIONS } from "@/lib/donaive-software/access";
import type { DsPermission, DsRole, DsSession, DsUser } from "@/types/donaive-software";

const USERS_KEY = "donaive-software-users-v1";
const SESSION_KEY = "donaive-software-session-v1";
const ROLE_MATRIX_KEY = "donaive-software-role-matrix-v1";

export const DS_DEFAULT_ADMIN_PASSWORD = "admin123";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Hash simple para demo offline (no usar en producción sin backend). */
export function hashPassword(password: string): string {
  let h = 0;
  const salt = "donaive-software-v1";
  const str = `${salt}:${password}`;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return `ds_${(h >>> 0).toString(16)}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function loadUsers(): DsUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DsUser[];
  } catch {
    return [];
  }
}

export function saveUsers(users: DsUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function loadSession(): DsSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DsSession;
  } catch {
    return null;
  }
}

export function saveSession(session: DsSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function loadRoleMatrix(): Partial<Record<DsRole, DsPermission[]>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ROLE_MATRIX_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<DsRole, DsPermission[]>>;
  } catch {
    return {};
  }
}

export function saveRoleMatrix(matrix: Partial<Record<DsRole, DsPermission[]>>): void {
  localStorage.setItem(ROLE_MATRIX_KEY, JSON.stringify(matrix));
}

export function ensureDefaultAdmin(): DsUser {
  const users = loadUsers();
  const existing = users.find((u) => u.role === "admin" && u.active);
  if (existing) return existing;

  const now = new Date().toISOString();
  const admin: DsUser = {
    id: uid("u"),
    username: "admin",
    name: "Administrador",
    role: "admin",
    active: true,
    passwordHash: hashPassword(DS_DEFAULT_ADMIN_PASSWORD),
    createdAt: now,
    updatedAt: now,
  };
  saveUsers([admin, ...users]);
  return admin;
}

export function authenticate(
  username: string,
  password: string,
): { ok: true; user: DsUser } | { ok: false; error: string } {
  const login = username.trim().toLowerCase();
  if (!login || !password) {
    return { ok: false, error: "Usuario y contraseña requeridos" };
  }
  const user = loadUsers().find(
    (u) => u.username.toLowerCase() === login && u.active,
  );
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, error: "Credenciales incorrectas" };
  }
  const session: DsSession = {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    loggedInAt: new Date().toISOString(),
  };
  saveSession(session);
  return { ok: true, user };
}

export function logout(): void {
  clearSession();
}

export function getUserById(id: string): DsUser | undefined {
  return loadUsers().find((u) => u.id === id);
}

export function resolveCurrentUser(): DsUser | null {
  const session = loadSession();
  if (!session) return null;

  if (session.remotePresident) {
    return {
      id: session.userId,
      username: session.username,
      name: session.name,
      role: "presidente",
      active: true,
      passwordHash: "",
      createdAt: session.loggedInAt,
      updatedAt: session.loggedInAt,
    };
  }

  const user = getUserById(session.userId);
  if (!user || !user.active) {
    clearSession();
    return null;
  }
  return user;
}

export function savePresidentSession(user: {
  id: string;
  username: string;
  name: string;
}): DsUser {
  const session: DsSession = {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: "presidente",
    loggedInAt: new Date().toISOString(),
    remotePresident: true,
  };
  saveSession(session);
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: "presidente",
    active: true,
    passwordHash: "",
    createdAt: session.loggedInAt,
    updatedAt: session.loggedInAt,
  };
}

export type UpsertUserInput = {
  id?: string;
  username: string;
  name: string;
  role: DsRole;
  active: boolean;
  password?: string;
  customPermissions?: DsPermission[];
  deniedPermissions?: DsPermission[];
};

export function upsertUser(
  input: UpsertUserInput,
): { ok: true; user: DsUser } | { ok: false; error: string } {
  const login = input.username.trim().toLowerCase();
  if (!login) return { ok: false, error: "Indique el usuario (login)" };
  if (!input.name.trim()) return { ok: false, error: "Indique el nombre" };

  const users = loadUsers();
  const duplicate = users.find(
    (u) => u.username.toLowerCase() === login && u.id !== input.id,
  );
  if (duplicate) return { ok: false, error: "Ese usuario ya existe" };

  const now = new Date().toISOString();

  if (input.id) {
    const idx = users.findIndex((u) => u.id === input.id);
    if (idx < 0) return { ok: false, error: "Usuario no encontrado" };
    const prev = users[idx];
    if (prev.role === "admin" && !input.active) {
      const admins = users.filter((u) => u.role === "admin" && u.active && u.id !== input.id);
      if (admins.length === 0) {
        return { ok: false, error: "Debe quedar al menos un administrador activo" };
      }
    }
    const pwd = input.password?.trim();
    if (pwd && pwd.length < 6) {
      return { ok: false, error: "La contraseña debe tener al menos 6 caracteres" };
    }
    const updated: DsUser = {
      ...prev,
      username: login,
      name: input.name.trim(),
      role: input.role,
      active: input.active,
      passwordHash: pwd ? hashPassword(pwd) : prev.passwordHash,
      customPermissions: input.customPermissions,
      deniedPermissions: input.deniedPermissions,
      updatedAt: now,
    };
    users[idx] = updated;
    saveUsers(users);
    return { ok: true, user: updated };
  }

  const pwd = input.password?.trim() ?? "";
  if (pwd.length < 6) {
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres" };
  }

  const created: DsUser = {
    id: uid("u"),
    username: login,
    name: input.name.trim(),
    role: input.role,
    active: input.active,
    passwordHash: hashPassword(pwd),
    customPermissions: input.customPermissions,
    deniedPermissions: input.deniedPermissions,
    createdAt: now,
    updatedAt: now,
  };
  saveUsers([...users, created]);
  return { ok: true, user: created };
}

export function setRolePermissions(input: {
  role: DsRole;
  permissions: DsPermission[];
}): { ok: true } | { ok: false; error: string } {
  if (input.role === "admin") {
    return { ok: false, error: "ADMIN siempre tiene todos los permisos" };
  }
  const matrix = loadRoleMatrix();
  matrix[input.role] = [...input.permissions];
  saveRoleMatrix(matrix);
  return { ok: true };
}

export function getEffectiveRolePermissions(
  role: DsRole,
): DsPermission[] {
  const matrix = loadRoleMatrix();
  return matrix[role] ?? DS_DEFAULT_ROLE_PERMISSIONS[role];
}
