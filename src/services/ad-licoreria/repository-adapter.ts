/**
 * Adapter de repository A&D.
 *
 * Fase 1: la UI sigue usando `adLicoreriaRepository` (MOCK).
 * Este módulo expone el punto de extensión para migrar módulo a módulo
 * cuando `VITE_AD_DATA_SOURCE=api`.
 */

import { adLicoreriaRepository } from "./repository";
import { getAdDataSource, type AdDataSource } from "./data-source";
import { adApiClient, type AdApiAuthHeaders } from "./api-client";

export type AdRepositoryPort = typeof adLicoreriaRepository;

/**
 * Repository activo para la UI.
 * En Fase 1 siempre retorna el MOCK — la migración de pantallas es Fase 2+.
 * El flag `api` habilita el cliente HTTP para pruebas / módulos futuros.
 */
export function getAdRepository(): AdRepositoryPort {
  // Mantener MOCK como fuente de verdad de UI en F1.
  return adLicoreriaRepository;
}

export function getAdDataSourceMode(): AdDataSource {
  return getAdDataSource();
}

/**
 * Acceso al cliente API cuando el flag está en `api`.
 * No sustituye todavía al repository MOCK de las pantallas.
 */
export function getAdApiBridge(auth: AdApiAuthHeaders) {
  if (getAdDataSource() !== "api") {
    return null;
  }
  return {
    client: adApiClient,
    auth,
  };
}

export { adLicoreriaRepository, adApiClient };
