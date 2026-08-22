export const apiConfig = {
  /**
   * Vacío = mismo origen (Vite proxy `/api` → API local).
   * Así un solo túnel Cloudflare sirve FE + API.
   */
  baseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "",
  timeoutMs: 15_000,
} as const;

export const API_BASE_URL = apiConfig.baseUrl;

/** Prefijo absoluto o vacío para rutas relativas `/api/...`. */
export function apiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Fuente de datos operativa A&D.
 * - `mock` (default): repository.ts en memoria — UI no migrada aún.
 * - `api`: habilita bridge HTTP `/api/v1/ad` (migración progresiva F2+).
 */
export const AD_DATA_SOURCE = (
  (import.meta.env.VITE_AD_DATA_SOURCE as string | undefined) ?? "mock"
).toLowerCase() as "mock" | "api";
