import type { EntityId, ISODateTime } from "@donaive/domain";
import type { ProjectCategory } from "@donaive/domain";

export const ANALYTICS_SENSITIVITY_LEVELS = [
  "aggregate",
  "detailed",
] as const;

export type AnalyticsSensitivity =
  (typeof ANALYTICS_SENSITIVITY_LEVELS)[number];

/**
 * Métricas agregadas exportadas por un Project hacia Donaive Analytics.
 * Solo lectura; Donaive no modifica datos operacionales del Project.
 */
export type OperationalMetrics = {
  sales?: number;
  unitsMoved?: number;
  inventoryValue?: number;
  rotation?: number;
  expenses?: number;
  costs?: number;
  profit?: number;
  productCategoryBreakdown?: Readonly<Record<string, number>>;
  trends?: Readonly<Record<string, number>>;
};

/**
 * Snapshot / export autorizado para analytics global.
 */
export type AnalyticsSnapshot = {
  readonly id: EntityId;
  readonly projectId: EntityId;
  readonly organizationId: EntityId;
  category: ProjectCategory;
  periodStart: ISODateTime;
  periodEnd: ISODateTime;
  metrics: OperationalMetrics;
  sensitivity: AnalyticsSensitivity;
  exportedAt: ISODateTime;
};

/**
 * Requisito futuro offline-first (sin implementación).
 * Documentado como contrato de intención para Projects operativos.
 */
export type OfflineSyncRequirement = {
  /** Base de datos local en el dispositivo/sucursal. */
  localDatabase: boolean;
  /** Motor de sincronización cloud ↔ local. */
  syncEngine: boolean;
  /** Cola de operaciones offline. */
  offlineQueue: boolean;
  /** Resolución de conflictos al reconectar. */
  conflictResolution: boolean;
};

export const OFFLINE_SYNC_REQUIREMENT: OfflineSyncRequirement = {
  localDatabase: true,
  syncEngine: true,
  offlineQueue: true,
  conflictResolution: true,
};
