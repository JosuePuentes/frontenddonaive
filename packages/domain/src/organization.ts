import type { EntityId, ISODateTime } from "./common";

export const ORGANIZATION_STATUSES = [
  "active",
  "inactive",
  "suspended",
  "archived",
] as const;

export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

/**
 * Tenant comercial de la plataforma Donaive.
 * Distinto del tipo `Organization` del bounded context CRM (src/types/crm.ts),
 * que modela organizaciones en el pipeline comercial.
 */
export type Organization = {
  /** Inmutable después de creación. */
  readonly id: EntityId;
  name: string;
  legalName?: string;
  status: OrganizationStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};
