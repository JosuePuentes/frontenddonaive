export const apiConfig = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "",
  // Prepared for future integration. No requests are made from this scaffold.
  timeoutMs: 15_000,
} as const;

export const API_BASE_URL = apiConfig.baseUrl;

/**
 * Fuente de datos operativa A&D.
 * - `mock` (default): repository.ts en memoria — UI no migrada aún.
 * - `api`: habilita bridge HTTP `/api/v1/ad` (migración progresiva F2+).
 */
export const AD_DATA_SOURCE = (
  (import.meta.env.VITE_AD_DATA_SOURCE as string | undefined) ?? "mock"
).toLowerCase() as "mock" | "api";
