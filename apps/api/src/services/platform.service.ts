import { getPrisma } from "../config/database.js";
import type { AuthContext } from "../auth/authorization.js";
import { requireCapability } from "../auth/authorization.js";
import { API_CAPABILITIES } from "../auth/capabilities.js";

export class TemplateService {
  async list(ctx: AuthContext) {
    requireCapability(ctx, API_CAPABILITIES.CORE_READ);
    const prisma = getPrisma();
    return prisma.template.findMany({
      include: { versions: { orderBy: { createdAt: "desc" }, take: 5 } },
      orderBy: { createdAt: "desc" },
    });
  }
}

export class UpdateService {
  async list(ctx: AuthContext) {
    requireCapability(ctx, API_CAPABILITIES.PROJECT_UPDATES_READ);
    const prisma = getPrisma();
    return prisma.update.findMany({
      include: { release: true, targets: true },
      orderBy: { createdAt: "desc" },
    });
  }
}

export class PlanService {
  async list(ctx: AuthContext) {
    requireCapability(ctx, API_CAPABILITIES.LICENSE_READ);
    const prisma = getPrisma();
    return prisma.plan.findMany({ orderBy: { createdAt: "desc" } });
  }
}

export class LicenseService {
  async list(ctx: AuthContext) {
    requireCapability(ctx, API_CAPABILITIES.LICENSE_READ);
    const prisma = getPrisma();

    const where =
      ctx.roles.includes("donaive_admin") || ctx.roles.includes("donaive_operator")
        ? {}
        : { projectId: { in: ctx.accessibleProjectIds } };

    return prisma.license.findMany({
      where,
      include: { plan: true, project: { select: { id: true, commercialName: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
}

export class SubscriptionService {
  async list(ctx: AuthContext) {
    requireCapability(ctx, API_CAPABILITIES.SUBSCRIPTION_READ);
    const prisma = getPrisma();

    const where =
      ctx.roles.includes("donaive_admin") || ctx.roles.includes("donaive_operator")
        ? {}
        : { projectId: { in: ctx.accessibleProjectIds } };

    return prisma.subscription.findMany({
      where,
      include: { plan: true, project: { select: { id: true, commercialName: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const templateService = new TemplateService();
export const updateService = new UpdateService();
export const planService = new PlanService();
export const licenseService = new LicenseService();
export const subscriptionService = new SubscriptionService();
