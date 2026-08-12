import type { EntityId, ISODateTime, LifecycleWindow } from "./common";
import type { ModuleKey } from "./module";

export const LICENSE_STATUSES = [
  "active",
  "trial",
  "grace",
  "past_due",
  "expired",
  "suspended",
  "revoked",
] as const;

export type LicenseStatus = (typeof LICENSE_STATUSES)[number];

export const ENTITLEMENT_SOURCES = [
  "plan",
  "addon",
  "trial",
  "custom",
  "promotion",
] as const;

export type EntitlementSource = (typeof ENTITLEMENT_SOURCES)[number];

/**
 * Derecho de uso técnico de un Project/Instance.
 * Separado de Plan y Subscription.
 */
export type License = {
  readonly id: EntityId;
  readonly projectId: EntityId;
  readonly organizationId: EntityId;
  readonly planId?: EntityId;
  status: LicenseStatus;
  lifecycle: LifecycleWindow;
  deviceLimit?: number;
  activationRef?: string;
  renewalRef?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

/**
 * Módulo o capacidad habilitada para un Project vía licencia/plan/addon.
 */
export type Entitlement = {
  readonly id: EntityId;
  readonly projectId: EntityId;
  readonly licenseId?: EntityId;
  module: ModuleKey;
  enabled: boolean;
  source: EntitlementSource;
  limits?: Readonly<Record<string, number>>;
};
