export const apiConfig = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "",
  // Prepared for future integration. No requests are made from this scaffold.
  timeoutMs: 15_000,
} as const;

export const API_BASE_URL = apiConfig.baseUrl;
