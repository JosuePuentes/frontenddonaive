import type { EntityId } from "@donaive/domain";
import type { AgentCapability, Capability } from "./capabilities";

export const AGENT_ACCESS_MODES = [
  "read",
  "analyze",
  "suggest",
  "generate",
  "prepare",
] as const;

export type AgentAccessMode = (typeof AGENT_ACCESS_MODES)[number];

/**
 * Permisos de un agente IA sobre un Project.
 * publish/execute requieren aprobación humana (no autonomía).
 */
export type AgentPermission = {
  mode: AgentAccessMode;
  capabilities: readonly AgentCapability[];
  requiresApprovalFor: readonly ("publish" | "execute")[];
};

/**
 * Alcance de acceso de un agente a un Project concreto.
 */
export type ProjectAccess = {
  readonly projectId: EntityId;
  readonly organizationId: EntityId;
  permissions: AgentPermission;
  /** Solo lectura por defecto para datos operacionales. */
  readOnly: boolean;
};

/**
 * Contexto mínimo para ejecución de un agente IA.
 */
export type AgentContext = {
  readonly agentRunId: EntityId;
  readonly actorId?: EntityId;
  projectAccess?: ProjectAccess;
  capabilities: readonly Capability[];
  /** Referencia a aprobación humana cuando aplique. */
  approvalId?: EntityId;
};
