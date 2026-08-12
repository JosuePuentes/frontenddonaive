import type { EntityId, ISODateTime } from "./common";

/**
 * Categoría industrial interna. No determina el nombre comercial del Project.
 * @see docs/architecture/DONAIVE_V2_MULTI_PROJECT_PLATFORM.md
 */
export const PROJECT_CATEGORIES = [
  "pharmacy",
  "drugstore",
  "hardware",
  "liquor_store",
  "liquor_and_grocery",
  "grocery",
  "restaurant",
  "retail",
  "services",
  "custom",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_STATUSES = [
  "draft",
  "provisioning",
  "active",
  "paused",
  "suspended",
  "archived",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/**
 * Instancia operacional de un sistema empresarial para un cliente.
 * Distinto del tipo `Project` del CRM (src/types/crm.ts), que modela
 * proyectos comerciales / entregables del pipeline de ventas.
 */
export type Project = {
  /** Inmutable. */
  readonly id: EntityId;
  /** Inmutable. */
  readonly organizationId: EntityId;
  /** Nombre comercial (mutable). Ej: "Licorería y Bodegón A&D". */
  name: string;
  /** Identificador técnico estable (mutable con reglas de unicidad). */
  slug: string;
  category: ProjectCategory;
  status: ProjectStatus;
  templateId?: EntityId;
  currentVersionId?: EntityId;
  /** Dominio primario de conveniencia; ver ProjectDomain para lista completa. */
  domain?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};
