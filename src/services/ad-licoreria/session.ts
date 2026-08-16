/**
 * Sesión A&D (modo API) — JWT Fase 4.
 */
import { API_BASE_URL } from "@/config/api";

const STORAGE_KEY = "ad_licoreria_api_session_v1";

export type AdApiSession = {
  accessToken: string;
  tokenType: "Bearer";
  expiresAt: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  timezone: string;
  projectId: string;
  operatorId: string;
  userId: string;
  username: string;
  name: string;
  role: string;
  warehouseId: string | null;
  permissions: string[];
};

let memorySession: AdApiSession | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function subscribeAdSession(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function loadAdSession(): AdApiSession | null {
  if (memorySession) return memorySession;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    memorySession = JSON.parse(raw) as AdApiSession;
    return memorySession;
  } catch {
    return null;
  }
}

export function saveAdSession(session: AdApiSession) {
  memorySession = session;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  emit();
}

export function clearAdSession() {
  memorySession = null;
  sessionStorage.removeItem(STORAGE_KEY);
  emit();
}

/** true si hay JWT en storage y `expiresAt` aún no pasó. */
export function isAdSessionValid(
  session: AdApiSession | null = loadAdSession(),
): boolean {
  if (!session?.accessToken) return false;
  if (!session.expiresAt) return true;
  const exp = Date.parse(session.expiresAt);
  if (Number.isNaN(exp)) return true;
  return exp > Date.now() + 5_000;
}

export function getAdSessionHeaders(): Record<string, string> {
  const s = loadAdSession();
  if (!isAdSessionValid(s)) {
    if (s) clearAdSession();
    return {};
  }
  return {
    Authorization: `Bearer ${s!.accessToken}`,
  };
}

export async function adLoginRequest(input: {
  tenantSlug: string;
  username: string;
  password: string;
}): Promise<{ ok: true; session: AdApiSession } | { ok: false; error: string }> {
  try {
    const res = await fetch(
      `${API_BASE_URL.replace(/\/+$/, "")}/api/v1/ad/auth/login`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantSlug: input.tenantSlug,
          username: input.username,
          password: input.password,
        }),
      },
    );
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error:
          (payload as { error?: { message?: string } })?.error?.message ??
          `HTTP ${res.status}`,
      };
    }
    const data = (payload as { data: Record<string, unknown> }).data;
    const tenant = data.tenant as {
      id: string;
      slug: string;
      name: string;
      timezone: string;
      projectId: string;
    };
    const operator = data.operator as {
      id: string;
      userId: string | null;
      username: string;
      name: string;
      role: string;
      warehouseId: string | null;
    };
    const accessToken = String(data.accessToken ?? "");
    if (!accessToken) {
      return { ok: false, error: "Login sin accessToken (API F4 requerida)" };
    }
    const session: AdApiSession = {
      accessToken,
      tokenType: "Bearer",
      expiresAt: String(data.expiresAt ?? ""),
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      timezone: tenant.timezone,
      projectId: tenant.projectId,
      operatorId: operator.id,
      userId: operator.userId ?? operator.id,
      username: operator.username,
      name: operator.name,
      role: operator.role,
      warehouseId: operator.warehouseId,
      permissions: (data.permissions as string[]) ?? [],
    };
    saveAdSession(session);
    return { ok: true, session };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error de red",
    };
  }
}

export async function adBootstrapRequest(input: {
  slug?: string;
  name?: string;
  adminPassword: string;
  adminUsername?: string;
}): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const res = await fetch(
      `${API_BASE_URL.replace(/\/+$/, "")}/api/v1/ad/bootstrap`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      },
    );
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error:
          (payload as { error?: { message?: string } })?.error?.message ??
          `HTTP ${res.status}`,
      };
    }
    return { ok: true, data: (payload as { data: unknown }).data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error de red",
    };
  }
}

export async function adLogoutRequest(): Promise<void> {
  const s = loadAdSession();
  if (!API_BASE_URL || !s?.accessToken) {
    clearAdSession();
    return;
  }
  try {
    await fetch(`${API_BASE_URL.replace(/\/+$/, "")}/api/v1/ad/auth/logout`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${s.accessToken}`,
      },
    });
  } catch {
    /* ignore */
  }
  clearAdSession();
}
