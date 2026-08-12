/**
 * Capabilities de plataforma Donaive.
 * No implementa autorización; solo contratos para uso futuro en backend.
 */

/** Capabilities Core (Donaive Admin / operadores de plataforma). */
export const CORE_CAPABILITIES = [
  "core.organization.read",
  "core.organization.write",
  "core.project.create",
  "core.project.read",
  "core.project.write",
  "core.template.manage",
  "core.update.assign",
  "core.update.publish",
  "core.license.manage",
  "core.subscription.manage",
  "core.domain.manage",
  "core.analytics.global.read",
  "core.audit.read",
  "core.users.manage",
] as const;

export type CoreCapability = (typeof CORE_CAPABILITIES)[number];

/** Capabilities de un Project concreto. */
export const PROJECT_CAPABILITIES = [
  "project.read",
  "project.write",
  "project.users.manage",
  "project.settings.manage",
  "project.analytics.read",
  "project.updates.manage",
  "project.billing.read",
  "project.modules.manage",
  "project.customizations.manage",
] as const;

export type ProjectCapability = (typeof PROJECT_CAPABILITIES)[number];

/** Capabilities de Donaive Intelligence (lectura agregada autorizada). */
export const INTELLIGENCE_CAPABILITIES = [
  "intelligence.project.read",
  "intelligence.category.read",
  "intelligence.global.read",
] as const;

export type IntelligenceCapability =
  (typeof INTELLIGENCE_CAPABILITIES)[number];

/** Capabilities de agentes IA (prepare vs publish/execute). */
export const AGENT_CAPABILITIES = [
  "agent.read",
  "agent.analyze",
  "agent.suggest",
  "agent.generate",
  "agent.prepare",
  "agent.publish",
  "agent.execute",
] as const;

export type AgentCapability = (typeof AGENT_CAPABILITIES)[number];

export type Capability =
  | CoreCapability
  | ProjectCapability
  | IntelligenceCapability
  | AgentCapability;

/** Roles conceptuales de la plataforma. */
export const PLATFORM_ROLES = [
  "donaive_admin",
  "donaive_operator",
  "project_admin",
  "project_manager",
  "project_user",
  "project_viewer",
  "donaive_intelligence",
  "ai_agent",
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/**
 * Sujeto de autorización futuro.
 */
export type AccessSubject = {
  userId?: string;
  role: PlatformRole;
  capabilities?: readonly Capability[];
  organizationId?: string;
  projectId?: string;
};
