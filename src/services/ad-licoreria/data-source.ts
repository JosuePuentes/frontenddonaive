/**
 * Fuente de datos A&D — abstracción MOCK → API.
 * Fase 1: default `mock`. No elimina repository.ts.
 */

export type AdDataSource = "mock" | "api";

export function getAdDataSource(): AdDataSource {
  const raw = (
    import.meta.env.VITE_AD_DATA_SOURCE as string | undefined
  )?.toLowerCase();
  if (raw === "api") return "api";
  return "mock";
}

export function isAdApiDataSource(): boolean {
  return getAdDataSource() === "api";
}
