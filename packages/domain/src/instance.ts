import type { EntityId, ISODateTime } from "./common";

export const PROJECT_INSTANCE_STATUSES = [
  "provisioning",
  "active",
  "paused",
  "suspended",
  "decommissioned",
] as const;

export type ProjectInstanceStatus =
  (typeof PROJECT_INSTANCE_STATUSES)[number];

export const INSTANCE_VERSION_STATUSES = [
  "active",
  "superseded",
  "rolled_back",
] as const;

export type InstanceVersionStatus =
  (typeof INSTANCE_VERSION_STATUSES)[number];

/**
 * Representa el sistema concreto vendido/instalado para un cliente.
 * Flujo: Template → TemplateVersion → ProjectInstance → InstanceVersion.
 */
export type ProjectInstance = {
  readonly id: EntityId;
  readonly projectId: EntityId;
  readonly templateId: EntityId;
  readonly templateVersionId: EntityId;
  status: ProjectInstanceStatus;
  currentInstanceVersionId?: EntityId;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

/**
 * Versión adoptada por una instancia concreta (puede diferir entre clientes).
 */
export type InstanceVersion = {
  readonly id: EntityId;
  readonly projectInstanceId: EntityId;
  readonly projectId: EntityId;
  version: string;
  status: InstanceVersionStatus;
  /** Referencia opcional a TemplateVersion origen. */
  templateVersionId?: EntityId;
  adoptedAt: ISODateTime;
  createdAt: ISODateTime;
};
