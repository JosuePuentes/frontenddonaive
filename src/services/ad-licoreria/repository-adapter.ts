/**
 * Adapter de repository A&D — Fase 3.
 * `mock` → repository.ts | `api` → api-backed-repository (+ sesión)
 */

import { adLicoreriaRepository } from "./repository";
import { adApiBackedRepository } from "./api-backed-repository";
import { getAdDataSource, type AdDataSource } from "./data-source";
import { adApiClient, type AdApiAuthHeaders } from "./api-client";
import { loadAdSession } from "./session";

export type AdRepositoryPort =
  | typeof adLicoreriaRepository
  | typeof adApiBackedRepository;

export const AD_API_READY_MODULES = [
  "auth",
  "context",
  "users",
  "warehouses",
  "products",
  "presentations",
  "inventory",
  "customers",
  "sales",
  "accounts",
  "mesonera",
  "payments",
  "prepaids",
  "qr",
  "purchases",
  "cop",
  "transfers",
  "closures",
  "audit",
  "reports",
  "tables",
] as const;

export type AdApiReadyModule = (typeof AD_API_READY_MODULES)[number];

export function getAdRepository(): AdRepositoryPort {
  if (getAdDataSource() === "api") {
    return adApiBackedRepository;
  }
  return adLicoreriaRepository;
}

export function getAdDataSourceMode(): AdDataSource {
  return getAdDataSource();
}

export function isAdApiModuleReady(module: AdApiReadyModule): boolean {
  if (getAdDataSource() !== "api") return false;
  if (!loadAdSession()) return false;
  return (AD_API_READY_MODULES as readonly string[]).includes(module);
}

export function getAdApiBridge(auth: AdApiAuthHeaders) {
  if (getAdDataSource() !== "api") return null;
  return { client: adApiClient, auth, readyModules: AD_API_READY_MODULES };
}

export { adLicoreriaRepository, adApiClient, adApiBackedRepository };
