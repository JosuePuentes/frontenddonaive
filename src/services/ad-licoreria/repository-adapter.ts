/**
 * Adapter de repository A&D.
 *
 * - `mock` (default): UI usa repository.ts
 * - `api`: bridge HTTP para módulos F1/F2 ya preparados (pantallas aún no migradas en bloque)
 */

import { adLicoreriaRepository } from "./repository";
import { getAdDataSource, type AdDataSource } from "./data-source";
import { adApiClient, type AdApiAuthHeaders } from "./api-client";

export type AdRepositoryPort = typeof adLicoreriaRepository;

/** Módulos con cliente API listo (Fase 2). La UI sigue en MOCK hasta Fase 3. */
export const AD_API_READY_MODULES = [
  "accounts",
  "inventory",
  "purchases",
  "transfers",
  "prepaids",
  "qr",
  "cop",
  "closures",
  "audit",
  "catalog",
  "sales",
] as const;

export type AdApiReadyModule = (typeof AD_API_READY_MODULES)[number];

/**
 * Repository activo para la UI.
 * Fase 2: sigue retornando MOCK — no migrar pantallas todavía.
 */
export function getAdRepository(): AdRepositoryPort {
  return adLicoreriaRepository;
}

export function getAdDataSourceMode(): AdDataSource {
  return getAdDataSource();
}

export function isAdApiModuleReady(module: AdApiReadyModule): boolean {
  if (getAdDataSource() !== "api") return false;
  return (AD_API_READY_MODULES as readonly string[]).includes(module);
}

/**
 * Bridge API cuando `VITE_AD_DATA_SOURCE=api`.
 * No sustituye al repository MOCK de las pantallas en F2.
 */
export function getAdApiBridge(auth: AdApiAuthHeaders) {
  if (getAdDataSource() !== "api") {
    return null;
  }
  return {
    client: adApiClient,
    auth,
    readyModules: AD_API_READY_MODULES,
  };
}

export { adLicoreriaRepository, adApiClient };
