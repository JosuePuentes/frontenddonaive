import type { AuditActorType, Prisma } from "@prisma/client";
import { getPrisma } from "../config/database.js";
import type { AuthContext } from "../auth/authorization.js";

export type AuditInput = {
  actorType?: AuditActorType;
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  projectId?: string;
  organizationId?: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  reason?: string;
  approvalId?: string;
  agentRunId?: string;
  capability?: string;
};

export class AuditService {
  async log(input: AuditInput, ctx?: AuthContext) {
    const prisma = getPrisma();

    return prisma.auditLog.create({
      data: {
        actorType: input.actorType ?? (ctx ? "user" : "system"),
        actorId: input.actorId ?? ctx?.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        projectId: input.projectId,
        organizationId: input.organizationId,
        before: input.before,
        after: input.after,
        metadata: input.metadata,
        reason: input.reason,
        approvalId: input.approvalId,
        agentRunId: input.agentRunId,
        capability: input.capability,
      },
    });
  }

  async list(ctx: AuthContext, filters?: { projectId?: string; limit?: number }) {
    const prisma = getPrisma();
    const limit = filters?.limit ?? 50;

    const where: Prisma.AuditLogWhereInput = {};

    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }

    if (!ctx.roles.includes("donaive_admin")) {
      if (ctx.accessibleProjectIds.length === 0) {
        return [];
      }
      where.projectId = filters?.projectId
        ? filters.projectId
        : { in: ctx.accessibleProjectIds };
    }

    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

export const auditService = new AuditService();
