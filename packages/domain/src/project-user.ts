import type { EntityId, ISODateTime } from "./common";

export const PROJECT_USER_ROLES = [
  "project_admin",
  "manager",
  "user",
  "viewer",
] as const;

export type ProjectUserRole = (typeof PROJECT_USER_ROLES)[number];

export const PROJECT_USER_STATUSES = [
  "active",
  "invited",
  "suspended",
  "removed",
] as const;

export type ProjectUserStatus = (typeof PROJECT_USER_STATUSES)[number];

/**
 * Usuario con acceso a un Project concreto.
 * Distinto de Donaive Admin (Core) y de usuarios CRM.
 */
export type ProjectUser = {
  readonly id: EntityId;
  readonly userId: EntityId;
  readonly projectId: EntityId;
  role: ProjectUserRole;
  status: ProjectUserStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};
