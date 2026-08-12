import type { EntityId, ISODateTime } from "./common";

export const PROJECT_DOMAIN_TYPES = [
  "subdomain",
  "custom_domain",
] as const;

export type ProjectDomainType = (typeof PROJECT_DOMAIN_TYPES)[number];

export const PROJECT_DOMAIN_STATUSES = [
  "pending",
  "active",
  "error",
  "disabled",
] as const;

export type ProjectDomainStatus =
  (typeof PROJECT_DOMAIN_STATUSES)[number];

/**
 * Dominio o subdominio asociado a un Project.
 * Un Project puede tener múltiples dominios.
 */
export type ProjectDomain = {
  readonly id: EntityId;
  readonly projectId: EntityId;
  hostname: string;
  type: ProjectDomainType;
  status: ProjectDomainStatus;
  isPrimary: boolean;
  sslStatus?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};
