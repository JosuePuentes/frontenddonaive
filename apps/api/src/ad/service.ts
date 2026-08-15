import { Prisma } from "@prisma/client";
import { getPrisma } from "../config/database.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../errors/app-error.js";
import {
  assertSameWarehouseSale,
  requireAdPermission,
  requireWarehouseAccess,
  resolveEffectiveWarehouseId,
  type AdRequestContext,
} from "./authorization.js";
import {
  buildSaleLineSnapshots,
  sumSaleTotals,
} from "./sales-domain.js";
import { hashPassword, verifyPassword } from "./password.js";

function dec(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n);
}

function toNum(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : Number(value);
}

export async function writeAdAudit(input: {
  tenantId: string;
  operatorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: string;
  before?: unknown;
  after?: unknown;
}) {
  const prisma = getPrisma();
  return prisma.adAuditEvent.create({
    data: {
      tenantId: input.tenantId,
      operatorId: input.operatorId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      detail: input.detail,
      before: input.before as Prisma.InputJsonValue | undefined,
      after: input.after as Prisma.InputJsonValue | undefined,
    },
  });
}

export const adService = {
  async health() {
    const prisma = getPrisma();
    let tenantCount = 0;
    try {
      tenantCount = await prisma.adTenant.count();
    } catch (err) {
      return {
        status: "degraded",
        module: "ad-licoreria",
        schema: "ad_licoreria",
        phase: 1,
        error: err instanceof Error ? err.message : "schema query failed",
      };
    }
    return {
      status: "ok",
      module: "ad-licoreria",
      schema: "ad_licoreria",
      phase: 1,
      tenantCount,
    };
  },

  async getContext(ctx: AdRequestContext) {
    return {
      tenantId: ctx.tenantId,
      projectId: ctx.projectId,
      operator: {
        id: ctx.operator.id,
        username: ctx.operator.username,
        name: ctx.operator.name,
        role: ctx.operator.role,
        warehouseId: ctx.operator.warehouseId,
      },
      warehouseId: ctx.warehouseId,
      permissions: [...ctx.permissions],
    };
  },

  async loginOperator(input: {
    tenantId: string;
    username: string;
    password: string;
  }) {
    const prisma = getPrisma();
    const op = await prisma.adOperator.findUnique({
      where: {
        tenantId_username: {
          tenantId: input.tenantId,
          username: input.username,
        },
      },
      include: { permissions: true },
    });
    if (!op || !op.active || !op.passwordHash) {
      throw new ForbiddenError("Credenciales A&D inválidas");
    }
    if (!verifyPassword(input.password, op.passwordHash)) {
      throw new ForbiddenError("Credenciales A&D inválidas");
    }
    await writeAdAudit({
      tenantId: op.tenantId,
      operatorId: op.id,
      action: "login",
      entity: "operator",
      entityId: op.id,
    });
    return {
      operatorId: op.id,
      tenantId: op.tenantId,
      username: op.username,
      role: op.role,
      warehouseId: op.warehouseId,
    };
  },

  async listWarehouses(ctx: AdRequestContext) {
    const prisma = getPrisma();
    const rows = await prisma.adWarehouse.findMany({
      where: { tenantId: ctx.tenantId, active: true },
      orderBy: { code: "asc" },
    });
    if (ctx.operator.role === "cajero" || ctx.operator.role === "mesonera") {
      return rows.filter((w) => w.id === ctx.operator.warehouseId);
    }
    return rows;
  },

  async createWarehouse(
    ctx: AdRequestContext,
    input: { name: string; code: string },
  ) {
    requireAdPermission(ctx, "deposits.manage");
    const prisma = getPrisma();
    const warehouse = await prisma.adWarehouse.create({
      data: {
        tenantId: ctx.tenantId,
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
      },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "create",
      entity: "warehouse",
      entityId: warehouse.id,
      after: warehouse,
    });
    return warehouse;
  },

  async listProducts(ctx: AdRequestContext) {
    const prisma = getPrisma();
    return prisma.adProduct.findMany({
      where: { tenantId: ctx.tenantId },
      include: { presentations: true },
      orderBy: { name: "asc" },
    });
  },

  async createProduct(
    ctx: AdRequestContext,
    input: {
      name: string;
      brand?: string;
      sku?: string;
      barcode?: string;
      description?: string;
      baseUnitLabel: string;
      categoryId?: string;
      minStockBase?: number;
    },
  ) {
    requireAdPermission(ctx, "settings.manage");
    const prisma = getPrisma();
    const product = await prisma.adProduct.create({
      data: {
        tenantId: ctx.tenantId,
        name: input.name.trim(),
        brand: input.brand,
        sku: input.sku,
        barcode: input.barcode,
        description: input.description,
        baseUnitLabel: input.baseUnitLabel,
        categoryId: input.categoryId,
        minStockBase: input.minStockBase ?? 0,
      },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "create",
      entity: "product",
      entityId: product.id,
      after: product,
    });
    return product;
  },

  async createPresentation(
    ctx: AdRequestContext,
    productId: string,
    input: {
      name: string;
      code?: string;
      unitsPerPresentation: number;
      priceUsd: number;
      priceBs: number;
      minPriceUsd?: number;
      maxPriceUsd?: number;
      sku?: string;
      barcode?: string;
    },
  ) {
    requireAdPermission(ctx, "settings.manage");
    const prisma = getPrisma();
    const product = await prisma.adProduct.findFirst({
      where: { id: productId, tenantId: ctx.tenantId },
    });
    if (!product) throw new NotFoundError("Producto no encontrado");

    const presentation = await prisma.adPresentation.create({
      data: {
        productId,
        name: input.name.trim(),
        code: input.code,
        unitsPerPresentation: dec(input.unitsPerPresentation),
        priceUsd: dec(input.priceUsd),
        priceBs: dec(input.priceBs),
        minPriceUsd:
          input.minPriceUsd !== undefined ? dec(input.minPriceUsd) : undefined,
        maxPriceUsd:
          input.maxPriceUsd !== undefined ? dec(input.maxPriceUsd) : undefined,
        sku: input.sku,
        barcode: input.barcode,
      },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "create",
      entity: "presentation",
      entityId: presentation.id,
      after: presentation,
    });
    return presentation;
  },

  async getStock(ctx: AdRequestContext, warehouseId: string, productId?: string) {
    requireAdPermission(ctx, "inventory.read");
    requireWarehouseAccess(ctx, warehouseId);
    const prisma = getPrisma();
    return prisma.adStock.findMany({
      where: {
        warehouseId,
        ...(productId ? { productId } : {}),
      },
      include: { product: true },
    });
  },

  async setStock(
    ctx: AdRequestContext,
    input: { warehouseId: string; productId: string; qtyBase: number },
  ) {
    requireAdPermission(ctx, "inventory.adjust");
    const warehouseId = resolveEffectiveWarehouseId(
      ctx.operator,
      input.warehouseId,
    );
    if (!warehouseId) {
      throw new ValidationError("Depósito requerido");
    }
    requireWarehouseAccess(ctx, warehouseId);

    const prisma = getPrisma();
    const before = await prisma.adStock.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId: input.productId,
        },
      },
    });

    const stock = await prisma.adStock.upsert({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId: input.productId,
        },
      },
      create: {
        warehouseId,
        productId: input.productId,
        qtyBase: dec(input.qtyBase),
      },
      update: { qtyBase: dec(input.qtyBase) },
    });

    const delta =
      input.qtyBase - (before ? toNum(before.qtyBase) : 0);

    await prisma.adInventoryMovement.create({
      data: {
        warehouseId,
        productId: input.productId,
        type: "ADJUST",
        qtyBase: dec(delta),
        operatorId: ctx.operator.id,
        reason: "set_stock",
      },
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "set",
      entity: "stock",
      entityId: stock.id,
      before,
      after: stock,
    });
    return stock;
  },

  async listCustomers(ctx: AdRequestContext) {
    requireAdPermission(ctx, "clients.read");
    const prisma = getPrisma();
    return prisma.adCustomer.findMany({
      where: { tenantId: ctx.tenantId, active: true },
      orderBy: { name: "asc" },
    });
  },

  async createCustomer(
    ctx: AdRequestContext,
    input: { name: string; phone: string; document?: string },
  ) {
    requireAdPermission(ctx, "clients.read");
    const prisma = getPrisma();
    const customer = await prisma.adCustomer.create({
      data: {
        tenantId: ctx.tenantId,
        name: input.name.trim(),
        phone: input.phone.trim(),
        document: input.document?.trim(),
      },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "create",
      entity: "customer",
      entityId: customer.id,
      after: customer,
    });
    return customer;
  },

  async createSale(
    ctx: AdRequestContext,
    input: {
      warehouseId: string;
      customerId?: string;
      notes?: string;
      lines: { presentationId: string; qty: number }[];
      payments?: {
        method: string;
        currency: "USD" | "BS";
        amount: number;
        reference?: string;
        bank?: string;
      }[];
    },
  ) {
    requireAdPermission(ctx, "pos.sell");
    const warehouseId = resolveEffectiveWarehouseId(
      ctx.operator,
      input.warehouseId,
    );
    if (!warehouseId) {
      throw new ValidationError("Depósito requerido para venta");
    }
    assertSameWarehouseSale(ctx.operator, warehouseId);
    requireWarehouseAccess(ctx, warehouseId);

    const prisma = getPrisma();
    const presentationIds = input.lines.map((l) => l.presentationId);
    const presentations = await prisma.adPresentation.findMany({
      where: { id: { in: presentationIds }, active: true },
      include: { product: true },
    });

    for (const p of presentations) {
      if (p.product.tenantId !== ctx.tenantId) {
        throw new ForbiddenError("Presentación fuera del tenant");
      }
    }

    const presentationMap = new Map(
      presentations.map((p) => [
        p.id,
        {
          id: p.id,
          productId: p.productId,
          unitsPerPresentation: toNum(p.unitsPerPresentation),
          priceUsd: toNum(p.priceUsd),
          priceBs: toNum(p.priceBs),
          active: p.active,
        },
      ]),
    );

    const lineSnapshots = buildSaleLineSnapshots(input.lines, presentationMap);
    const totals = sumSaleTotals(lineSnapshots);

    const sale = await prisma.$transaction(async (tx) => {
      for (const line of lineSnapshots) {
        const stock = await tx.adStock.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId,
              productId: line.productId,
            },
          },
        });
        const qty = stock ? toNum(stock.qtyBase) : 0;
        if (qty < line.qtyBase) {
          throw new ValidationError(
            `Stock insuficiente para producto ${line.productId}`,
          );
        }
      }

      for (const line of lineSnapshots) {
        await tx.adStock.update({
          where: {
            warehouseId_productId: {
              warehouseId,
              productId: line.productId,
            },
          },
          data: {
            qtyBase: { decrement: dec(line.qtyBase) },
          },
        });
        await tx.adInventoryMovement.create({
          data: {
            warehouseId,
            productId: line.productId,
            type: "SALE",
            qtyBase: dec(-line.qtyBase),
            presentationId: line.presentationId,
            qtyPresentation: dec(line.qty),
            operatorId: ctx.operator.id,
          },
        });
      }

      const count = await tx.adSale.count({ where: { tenantId: ctx.tenantId } });
      const year = new Date().getFullYear();
      const receiptNumber = `AD-${year}-${String(count + 1).padStart(6, "0")}`;

      return tx.adSale.create({
        data: {
          tenantId: ctx.tenantId,
          warehouseId,
          operatorId: ctx.operator.id,
          customerId: input.customerId,
          receiptNumber,
          status: "completed",
          totalUsd: dec(totals.totalUsd),
          totalBs: dec(totals.totalBs),
          notes: input.notes,
          lines: {
            create: lineSnapshots.map((line) => ({
              productId: line.productId,
              presentationId: line.presentationId,
              qty: dec(line.qty),
              qtyBase: dec(line.qtyBase),
              unitPriceUsd: dec(line.unitPriceUsd),
              unitPriceBs: dec(line.unitPriceBs),
              lineTotalUsd: dec(line.lineTotalUsd),
              lineTotalBs: dec(line.lineTotalBs),
            })),
          },
          payments: input.payments
            ? {
                create: input.payments.map((p) => ({
                  method: p.method,
                  currency: p.currency,
                  amount: dec(p.amount),
                  reference: p.reference,
                  bank: p.bank,
                })),
              }
            : undefined,
        },
        include: { lines: true, payments: true },
      });
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "create",
      entity: "sale",
      entityId: sale.id,
      detail: sale.receiptNumber,
      after: {
        totalUsd: toNum(sale.totalUsd),
        totalBs: toNum(sale.totalBs),
        lines: sale.lines,
      },
    });

    return sale;
  },

  async listAudit(ctx: AdRequestContext, limit = 50) {
    requireAdPermission(ctx, "reports.read");
    const prisma = getPrisma();
    return prisma.adAuditEvent.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 200),
    });
  },

  /** Utilidad de seed/ops: hashear password de operador (nunca texto plano). */
  hashOperatorPassword(plain: string): string {
    return hashPassword(plain);
  },
};
