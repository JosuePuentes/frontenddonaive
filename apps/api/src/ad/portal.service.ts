/**
 * Portal A&D Fase 3 — operadores, listados, snapshot, reportes, patch warehouse.
 */
import { Prisma } from "@prisma/client";
import { getPrisma } from "../config/database.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../errors/app-error.js";
import {
  requireAdPermission,
  type AdRequestContext,
} from "./authorization.js";
import { hashPassword } from "./password.js";
import { writeAdAudit } from "./service.js";
import type { AdOperatorRoleName, AdPermission } from "./permissions.js";
import { AD_DEFAULT_ROLE_PERMISSIONS, isAdPermission } from "./permissions.js";
import { todayPeriodBounds } from "./availability.js";

function dec(n: number) {
  return new Prisma.Decimal(n);
}
function num(v: Prisma.Decimal | number) {
  return typeof v === "number" ? v : Number(v);
}

export const adPortalService = {
  async listOperators(ctx: AdRequestContext) {
    requireAdPermission(ctx, "users.manage");
    const prisma = getPrisma();
    return prisma.adOperator.findMany({
      where: { tenantId: ctx.tenantId },
      include: { permissions: true, warehouse: true },
      orderBy: { username: "asc" },
    });
  },

  async upsertOperator(
    ctx: AdRequestContext,
    input: {
      id?: string;
      username: string;
      name: string;
      role: AdOperatorRoleName;
      active?: boolean;
      warehouseId?: string | null;
      password?: string;
      permissions?: string[];
    },
  ) {
    requireAdPermission(ctx, "users.manage");
    if (
      (input.role === "cajero" || input.role === "mesonera") &&
      !input.warehouseId
    ) {
      throw new ValidationError(
        "Cajero/mesonera requieren depósito asignado",
      );
    }
    const prisma = getPrisma();
    const passwordHash = input.password
      ? hashPassword(input.password)
      : undefined;

    let operator;
    if (input.id) {
      const existing = await prisma.adOperator.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new NotFoundError("Operador no encontrado");
      operator = await prisma.adOperator.update({
        where: { id: input.id },
        data: {
          username: input.username.trim(),
          name: input.name.trim(),
          role: input.role,
          active: input.active ?? true,
          warehouseId: input.warehouseId ?? null,
          ...(passwordHash ? { passwordHash } : {}),
        },
      });
    } else {
      operator = await prisma.adOperator.create({
        data: {
          tenantId: ctx.tenantId,
          username: input.username.trim(),
          name: input.name.trim(),
          role: input.role,
          active: input.active ?? true,
          warehouseId: input.warehouseId ?? null,
          passwordHash: passwordHash ?? hashPassword("changeme1"),
        },
      });
    }

    if (input.permissions) {
      await prisma.adOperatorPermission.deleteMany({
        where: { operatorId: operator.id },
      });
      const perms = input.permissions.filter(isAdPermission);
      if (perms.length) {
        await prisma.adOperatorPermission.createMany({
          data: perms.map((permission) => ({
            operatorId: operator.id,
            permission,
          })),
        });
      }
    }

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: input.id ? "update" : "create",
      entity: "operator",
      entityId: operator.id,
      after: {
        username: operator.username,
        role: operator.role,
        warehouseId: operator.warehouseId,
      },
    });

    return prisma.adOperator.findUniqueOrThrow({
      where: { id: operator.id },
      include: { permissions: true },
    });
  },

  async getRoleMatrix(ctx: AdRequestContext) {
    requireAdPermission(ctx, "users.manage");
    return AD_DEFAULT_ROLE_PERMISSIONS;
  },

  async updateWarehouse(
    ctx: AdRequestContext,
    warehouseId: string,
    input: { name?: string; active?: boolean },
  ) {
    requireAdPermission(ctx, "deposits.manage");
    const prisma = getPrisma();
    const existing = await prisma.adWarehouse.findFirst({
      where: { id: warehouseId, tenantId: ctx.tenantId },
    });
    if (!existing) throw new NotFoundError("Depósito no encontrado");
    const updated = await prisma.adWarehouse.update({
      where: { id: warehouseId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "update",
      entity: "warehouse",
      entityId: warehouseId,
      before: existing,
      after: updated,
    });
    return updated;
  },

  async listAccounts(
    ctx: AdRequestContext,
    opts?: { mesoneraId?: string; status?: string },
  ) {
    const prisma = getPrisma();
    const where: Prisma.AdAccountWhereInput = { tenantId: ctx.tenantId };
    if (ctx.operator.role === "mesonera") {
      where.warehouseId = ctx.operator.warehouseId ?? undefined;
      where.mesoneraId = ctx.operator.id;
    } else if (ctx.operator.role === "cajero" && ctx.operator.warehouseId) {
      where.warehouseId = ctx.operator.warehouseId;
    }
    if (opts?.mesoneraId && ctx.operator.role !== "mesonera") {
      where.mesoneraId = opts.mesoneraId;
    }
    if (opts?.status) {
      where.status = opts.status as Prisma.EnumAdAccountStatusFilter["equals"];
    }
    return prisma.adAccount.findMany({
      where,
      include: { lines: true, payments: true, mesonera: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  },

  async getAccount(ctx: AdRequestContext, accountId: string) {
    const prisma = getPrisma();
    const account = await prisma.adAccount.findFirst({
      where: { id: accountId, tenantId: ctx.tenantId },
      include: { lines: true, payments: true, mesonera: true },
    });
    if (!account) throw new NotFoundError("Cuenta no encontrada");
    if (
      ctx.operator.role === "mesonera" &&
      (account.mesoneraId !== ctx.operator.id ||
        account.warehouseId !== ctx.operator.warehouseId)
    ) {
      throw new ForbiddenError("Cuenta no asignada a esta mesonera");
    }
    return account;
  },

  /** Snapshot para hidratar el frontend en modo API. */
  async getSnapshot(ctx: AdRequestContext) {
    const prisma = getPrisma();
    const [
      warehouses,
      operators,
      products,
      customers,
      stocks,
      accounts,
      sales,
      prepaids,
      purchases,
      transfers,
      auditEvents,
      commitments,
      purchaseRequests,
      cashClosures,
      invClosures,
      movements,
      tables,
    ] = await Promise.all([
      prisma.adWarehouse.findMany({ where: { tenantId: ctx.tenantId } }),
      prisma.adOperator.findMany({
        where: { tenantId: ctx.tenantId },
        include: { permissions: true },
      }),
      prisma.adProduct.findMany({
        where: { tenantId: ctx.tenantId },
        include: { presentations: true, category: true },
      }),
      prisma.adCustomer.findMany({ where: { tenantId: ctx.tenantId } }),
      prisma.adStock.findMany({
        where: { warehouse: { tenantId: ctx.tenantId } },
      }),
      prisma.adAccount.findMany({
        where: { tenantId: ctx.tenantId },
        include: { lines: true, payments: true },
        take: 300,
        orderBy: { createdAt: "desc" },
      }),
      prisma.adSale.findMany({
        where: { tenantId: ctx.tenantId },
        include: { lines: true, payments: true },
        take: 300,
        orderBy: { createdAt: "desc" },
      }),
      prisma.adPrepaid.findMany({
        where: { tenantId: ctx.tenantId },
        include: { items: true },
        take: 200,
      }),
      prisma.adPurchase.findMany({
        where: { tenantId: ctx.tenantId },
        include: { lines: true },
        take: 200,
      }),
      prisma.adStockTransfer.findMany({
        where: { tenantId: ctx.tenantId },
        include: { lines: true },
        take: 200,
      }),
      prisma.adAuditEvent.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.adCustomerCommitment.findMany({
        where: { tenantId: ctx.tenantId },
      }),
      prisma.adPurchaseRequest.findMany({
        where: { tenantId: ctx.tenantId },
      }),
      prisma.adCashClosure.findMany({
        where: { tenantId: ctx.tenantId },
        take: 50,
        orderBy: { createdAt: "desc" },
      }),
      prisma.adInventoryClosure.findMany({
        where: { tenantId: ctx.tenantId },
        include: { lines: true },
        take: 50,
      }),
      prisma.adInventoryMovement.findMany({
        where: { warehouse: { tenantId: ctx.tenantId } },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.adTableSpace.findMany({ where: { tenantId: ctx.tenantId } }),
    ]);

    return {
      tenantId: ctx.tenantId,
      projectId: ctx.projectId,
      operatorId: ctx.operator.id,
      warehouses,
      operators,
      products,
      customers,
      stocks,
      accounts,
      sales,
      prepaids,
      purchases,
      transfers,
      auditEvents,
      commitments,
      purchaseRequests,
      cashClosures,
      invClosures,
      movements,
      tables,
    };
  },

  async reportsSummary(
    ctx: AdRequestContext,
    opts?: { warehouseId?: string; from?: string; to?: string },
  ) {
    requireAdPermission(ctx, "reports.read");
    const prisma = getPrisma();
    const tenant = await prisma.adTenant.findUniqueOrThrow({
      where: { id: ctx.tenantId },
    });
    let from: Date;
    let to: Date;
    if (opts?.from && opts?.to) {
      from = new Date(opts.from);
      to = new Date(opts.to);
    } else {
      const bounds = todayPeriodBounds(tenant.timezone);
      from = bounds.periodStart;
      to = bounds.periodEnd;
    }
    const warehouseId =
      ctx.operator.role === "cajero" || ctx.operator.role === "mesonera"
        ? ctx.operator.warehouseId ?? undefined
        : opts?.warehouseId;

    const sales = await prisma.adSale.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: "completed",
        createdAt: { gte: from, lt: to },
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: { payments: true, lines: true },
    });

    const totalUsd = sales.reduce((a, s) => a + num(s.totalUsd), 0);
    const totalBs = sales.reduce((a, s) => a + num(s.totalBs), 0);
    const byMethod: Record<string, { usd: number; bs: number }> = {};
    for (const sale of sales) {
      for (const p of sale.payments) {
        const cur = byMethod[p.method] ?? { usd: 0, bs: 0 };
        if (p.currency === "USD") cur.usd += num(p.amount);
        else cur.bs += num(p.amount);
        byMethod[p.method] = cur;
      }
    }

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      timezone: tenant.timezone,
      warehouseId: warehouseId ?? null,
      salesCount: sales.length,
      totalUsd,
      totalBs,
      byMethod,
    };
  },

  async addAccountPayment(
    ctx: AdRequestContext,
    accountId: string,
    input: {
      method: string;
      currency: "USD" | "BS";
      amount: number;
      reference?: string;
      bank?: string;
    },
  ) {
    requireAdPermission(ctx, "pos.sell");
    const prisma = getPrisma();
    const account = await prisma.adAccount.findFirst({
      where: { id: accountId, tenantId: ctx.tenantId },
    });
    if (!account) throw new NotFoundError("Cuenta no encontrada");
    if (account.status === "CERRADA" || account.status === "ANULADA") {
      throw new ValidationError("Cuenta cerrada/anulada");
    }
    const payment = await prisma.adAccountPayment.create({
      data: {
        accountId,
        method: input.method,
        currency: input.currency,
        amount: dec(input.amount),
        reference: input.reference,
        bank: input.bank,
        operatorId: ctx.operator.id,
      },
    });
    await prisma.adAccount.update({
      where: { id: accountId },
      data: { status: "PARCIALMENTE_PAGADA" },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "payment",
      entity: "account",
      entityId: accountId,
      after: payment,
    });
    return payment;
  },
};

export type { AdPermission };
