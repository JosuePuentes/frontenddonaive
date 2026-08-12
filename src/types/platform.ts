/**
 * Re-export de contratos de plataforma (@donaive/domain, @donaive/core).
 *
 * Distinto de src/types/crm.ts donde Organization/Project son entidades
 * del pipeline comercial CRM.
 */
export type {
  Organization as PlatformOrganization,
  Project as PlatformProject,
  ProjectCategory,
  ProjectStatus,
  Template,
  TemplateVersion,
  ProjectInstance,
  InstanceVersion,
  ProjectCustomization,
  Module,
  ModuleKey,
  ProjectModule,
  Update,
  UpdateRelease,
  ProjectUpdate,
  Plan,
  License,
  Entitlement,
  Subscription,
  ProjectDomain,
  ProjectUser,
} from "@donaive/domain";

export {
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  MODULE_KEYS,
  LICENSE_STATUSES,
  SUBSCRIPTION_STATUSES,
} from "@donaive/domain";

export type {
  Capability,
  PlatformRole,
  AuditLog,
  AgentContext,
  ProjectAccess,
  AnalyticsSnapshot,
} from "@donaive/core";

export {
  CORE_CAPABILITIES,
  PROJECT_CAPABILITIES,
  PLATFORM_ROLES,
} from "@donaive/core";
