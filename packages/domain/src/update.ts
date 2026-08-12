import type { EntityId, ISODateTime } from "./common";
import type { ModuleKey } from "./module";
import type { ProjectCategory } from "./project";

export const UPDATE_STATUSES = [
  "draft",
  "published",
  "deprecated",
  "yanked",
] as const;

export type UpdateStatus = (typeof UPDATE_STATUSES)[number];

export const UPDATE_TARGET_MODES = [
  "project",
  "projects",
  "category",
  "compatible",
  "none",
] as const;

export type UpdateTargetMode = (typeof UPDATE_TARGET_MODES)[number];

export const PROJECT_UPDATE_STATUSES = [
  "assigned",
  "approved",
  "installing",
  "installed",
  "failed",
  "rolled_back",
  "skipped",
] as const;

export type ProjectUpdateStatus =
  (typeof PROJECT_UPDATE_STATUSES)[number];

/**
 * Actualización distribuible creada por Donaive Core.
 */
export type Update = {
  readonly id: EntityId;
  name: string;
  module: ModuleKey;
  fromVersion?: string;
  toVersion: string;
  compatibleCategories?: readonly ProjectCategory[];
  compatibleModules?: readonly ModuleKey[];
  status: UpdateStatus;
  releaseNotes?: string;
  createdAt: ISODateTime;
  publishedAt?: ISODateTime;
};

/**
 * Release publicado (alias semántico de Update publicado con metadatos de distribución).
 */
export type UpdateRelease = Update & {
  readonly releaseId: EntityId;
  releasedAt: ISODateTime;
};

/**
 * Política de destinatarios de una actualización.
 */
export type UpdateTarget = {
  readonly id: EntityId;
  readonly updateId: EntityId;
  mode: UpdateTargetMode;
  projectIds?: readonly EntityId[];
  category?: ProjectCategory;
};

/**
 * Asignación e historial de una actualización a un Project concreto.
 * El historial es append-only; no se sobrescribe.
 */
export type ProjectUpdate = {
  readonly id: EntityId;
  readonly updateId: EntityId;
  readonly projectId: EntityId;
  status: ProjectUpdateStatus;
  assignedBy?: EntityId;
  assignedAt: ISODateTime;
  approvedAt?: ISODateTime;
  installedAt?: ISODateTime;
  fromVersion?: string;
  toVersion?: string;
  failureReason?: string;
};
