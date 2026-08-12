import type { ProjectCategory, ProjectStatus, Prisma } from "@prisma/client";
import { getPrisma } from "../config/database.js";
import {
  type AuthContext,
  requireCapability,
  requireProjectAccess,
  filterAccessibleProjectIds,
} from "../auth/authorization.js";
import { API_CAPABILITIES } from "../auth/capabilities.js";
import { NotFoundError, ValidationError } from "../errors/app-error.js";
import { auditService } from "./audit.service.js";

export type CreateProjectInput = {
  organizationId: string;
  commercialName: string;
  technicalSlug: string;
  category: ProjectCategory;
  status?: ProjectStatus;
  templateId?: string;
  primaryDomain?: string;
};

export class ProjectService {
  async list(ctx: AuthContext) {
    requireCapability(ctx, API_CAPABILITIES.PROJECT_READ);

    const prisma = getPrisma();
    const where: Prisma.ProjectWhereInput = {};

    if (!ctx.roles.includes("donaive_admin") && !ctx.roles.includes("donaive_operator")) {
      where.id = { in: ctx.accessibleProjectIds };
    }

    return prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { id: true, name: true } },
      },
    });
  }

  async getById(ctx: AuthContext, projectId: string) {
    requireCapability(ctx, API_CAPABILITIES.PROJECT_READ);
    requireProjectAccess(ctx, projectId);

    const prisma = getPrisma();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: { select: { id: true, name: true } },
        domains: true,
        projectModules: { include: { module: true } },
      },
    });

    if (!project) {
      throw new NotFoundError("Project no encontrado");
    }

    return project;
  }

  async create(ctx: AuthContext, input: CreateProjectInput) {
    requireCapability(ctx, API_CAPABILITIES.PROJECT_WRITE);

    const prisma = getPrisma();

    const organization = await prisma.organization.findUnique({
      where: { id: input.organizationId },
    });

    if (!organization) {
      throw new ValidationError("Organization no encontrada");
    }

    const project = await prisma.project.create({
      data: {
        organizationId: input.organizationId,
        commercialName: input.commercialName,
        technicalSlug: input.technicalSlug,
        category: input.category,
        status: input.status ?? "draft",
        templateId: input.templateId,
        primaryDomain: input.primaryDomain,
      },
    });

    await auditService.log(
      {
        action: "project.create",
        entityType: "Project",
        entityId: project.id,
        projectId: project.id,
        organizationId: project.organizationId,
        after: project as unknown as Prisma.InputJsonValue,
      },
      ctx,
    );

    return project;
  }

  /** Filtra IDs para comprobar aislamiento entre Projects. */
  filterVisibleProjectIds(ctx: AuthContext, ids: string[]): string[] {
    return filterAccessibleProjectIds(ctx, ids);
  }
}

export const projectService = new ProjectService();
