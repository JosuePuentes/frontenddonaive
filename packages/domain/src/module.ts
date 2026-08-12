import type { EntityId } from "./common";
import type { ProjectCategory } from "./project";

export const MODULE_KEYS = [
  "pos",
  "inventory",
  "purchases",
  "expenses",
  "customers",
  "suppliers",
  "reports",
  "finance",
  "accounts_receivable",
  "accounts_payable",
  "offline",
  "ai",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export const MODULE_STATUSES = [
  "draft",
  "active",
  "deprecated",
  "archived",
] as const;

export type ModuleStatus = (typeof MODULE_STATUSES)[number];

export type Module = {
  readonly id: EntityId;
  key: ModuleKey;
  name: string;
  category?: ProjectCategory;
  version?: string;
  status: ModuleStatus;
};

/**
 * Módulo habilitado para un Project concreto.
 */
export type ProjectModule = {
  readonly projectId: EntityId;
  readonly moduleId: EntityId;
  enabled: boolean;
  version?: string;
};
