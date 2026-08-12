import type { EntityId, ISODateTime, JsonValue } from "@donaive/domain";
import type { Capability } from "./capabilities";

export const AUDIT_ACTOR_TYPES = [
  "user",
  "system",
  "agent",
  "service",
  "scheduler",
] as const;

export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];

/**
 * Registro append-only de auditoría.
 * Obligatorio para cambios administrativos, updates, permisos, IA y approvals.
 */
export type AuditLog = {
  readonly id: EntityId;
  actorType: AuditActorType;
  actorId?: EntityId;
  action: string;
  entityType: string;
  entityId: EntityId;
  projectId?: EntityId;
  organizationId?: EntityId;
  before?: JsonValue;
  after?: JsonValue;
  reason?: string;
  approvalId?: EntityId;
  agentRunId?: EntityId;
  capability?: Capability;
  createdAt: ISODateTime;
};
