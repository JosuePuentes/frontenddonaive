import type { EntityId, ISODateTime } from "./common";
import type { ProjectCategory } from "./project";

export const TEMPLATE_STATUSES = [
  "draft",
  "active",
  "deprecated",
  "archived",
] as const;

export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number];

export const TEMPLATE_VERSION_STATUSES = [
  "draft",
  "published",
  "deprecated",
  "yanked",
] as const;

export type TemplateVersionStatus =
  (typeof TEMPLATE_VERSION_STATUSES)[number];

/**
 * Familia reutilizable de software (Farmacia, Ferretería, POS, etc.).
 * Una Template NO es una empresa ni un cliente.
 */
export type Template = {
  readonly id: EntityId;
  name: string;
  slug: string;
  category: ProjectCategory;
  description?: string;
  status: TemplateStatus;
  currentVersionId?: EntityId;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

/**
 * Versión concreta de una plantilla. Inmutable después de publicada.
 */
export type TemplateVersion = {
  readonly id: EntityId;
  readonly templateId: EntityId;
  version: string;
  status: TemplateVersionStatus;
  releaseNotes?: string;
  createdAt: ISODateTime;
};
