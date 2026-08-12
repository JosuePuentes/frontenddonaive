import type { EntityId, ISODateTime, JsonValue } from "./common";

export const CUSTOMIZATION_TYPES = [
  "branding",
  "logo",
  "colors",
  "display_name",
  "module_toggle",
  "configuration",
  "behavior",
  "custom_field",
  "other",
] as const;

export type CustomizationType = (typeof CUSTOMIZATION_TYPES)[number];

export const CUSTOMIZATION_SOURCES = [
  "client_request",
  "donaive_dev",
  "import",
  "migration",
  "system_default",
] as const;

export type CustomizationSource = (typeof CUSTOMIZATION_SOURCES)[number];

/**
 * Personalización exclusiva de un Project/Instance.
 * NO modifica automáticamente la Template ni otros Projects.
 */
export type ProjectCustomization = {
  readonly id: EntityId;
  readonly projectId: EntityId;
  type: CustomizationType;
  key: string;
  value: JsonValue;
  source: CustomizationSource;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};
