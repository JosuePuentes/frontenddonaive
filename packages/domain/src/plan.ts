import type { EntityId, ISODateTime } from "./common";
import type { ModuleKey } from "./module";

export const PLAN_TIERS = [
  "basic",
  "professional",
  "enterprise",
  "custom",
] as const;

export type PlanTier = (typeof PLAN_TIERS)[number];

export const PLAN_STATUSES = [
  "draft",
  "active",
  "deprecated",
  "archived",
] as const;

export type PlanStatus = (typeof PLAN_STATUSES)[number];

/**
 * Qué compra/contrata el cliente (catálogo comercial).
 */
export type Plan = {
  readonly id: EntityId;
  name: string;
  tier: PlanTier;
  description?: string;
  status: PlanStatus;
  /** Módulos incluidos por defecto en el plan. */
  includedModules?: readonly ModuleKey[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};
