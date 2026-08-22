import { Prisma } from "@prisma/client";
import { getPrisma } from "../config/database.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../errors/app-error.js";
import {
  assertSameWarehouseSale,
  hasAdPermission,
  requireAdAnyPermission,
  requireAdPermission,
  requireWarehouseAccess,
  resolveEffectiveWarehouseId,
  type AdRequestContext,
} from "./authorization.js";
import { computeOperationalAvailability } from "./availability.js";
import {
  buildSaleLineSnapshots,
  sumSaleTotals,
} from "./sales-domain.js";
import { packPresentationCreates } from "./pack-presentations.js";
import { hashPassword, verifyPassword } from "./password.js";
import { cleanupAdLicoreriaDemoData } from "./cleanup-demo-data.js";

function dec(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n);
}

function toNum(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : Number(value);
}

export async function writeAdAudit(input: {
  tenantId: string;
  operatorId?: string | null;
  warehouseId?: string | null;
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
      warehouseId: input.warehouseId ?? null,
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
      taxable?: boolean;
      defaultUtilityPercent?: number;
      packMode?: "UNIT" | "BOX";
      unitsPerBox?: number;
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
        taxable: input.taxable ?? false,
        defaultUtilityPercent: dec(input.defaultUtilityPercent ?? 0),
        presentations: {
          create: packPresentationCreates({
            packMode: input.packMode,
            unitsPerBox: input.unitsPerBox,
            sku: input.sku,
            barcode: input.barcode,
          }),
        },
      },
      include: { presentations: true },
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

  async getProduct(ctx: AdRequestContext, productId: string) {
    requireAdPermission(ctx, "inventory.read");
    const prisma = getPrisma();
    const product = await prisma.adProduct.findFirst({
      where: { id: productId, tenantId: ctx.tenantId },
      include: { presentations: true, category: true },
    });
    if (!product) throw new NotFoundError("Producto no encontrado");
    return product;
  },

  async updateProduct(
    ctx: AdRequestContext,
    productId: string,
    input: {
      name?: string;
      brand?: string | null;
      sku?: string | null;
      barcode?: string | null;
      description?: string | null;
      baseUnitLabel?: string;
      categoryId?: string | null;
      minStockBase?: number;
      taxable?: boolean;
      defaultUtilityPercent?: number;
      active?: boolean;
      packMode?: "UNIT" | "BOX";
      unitsPerBox?: number;
    },
  ) {
    requireAdPermission(ctx, "products.manage");
    const prisma = getPrisma();
    const existing = await prisma.adProduct.findFirst({
      where: { id: productId, tenantId: ctx.tenantId },
      include: { presentations: true },
    });
    if (!existing) throw new NotFoundError("Producto no encontrado");

    const before = { ...existing };
    const product = await prisma.adProduct.update({
      where: { id: productId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.brand !== undefined ? { brand: input.brand } : {}),
        ...(input.sku !== undefined ? { sku: input.sku } : {}),
        ...(input.barcode !== undefined ? { barcode: input.barcode } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.baseUnitLabel !== undefined
          ? { baseUnitLabel: input.baseUnitLabel }
          : {}),
        ...(input.categoryId !== undefined
          ? { categoryId: input.categoryId }
          : {}),
        ...(input.minStockBase !== undefined
          ? { minStockBase: dec(input.minStockBase) }
          : {}),
        ...(input.taxable !== undefined ? { taxable: input.taxable } : {}),
        ...(input.defaultUtilityPercent !== undefined
          ? { defaultUtilityPercent: dec(input.defaultUtilityPercent) }
          : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
      include: { presentations: true, category: true },
    });

    if (input.unitsPerBox !== undefined && input.unitsPerBox > 1) {
      const boxPres = [...existing.presentations]
        .filter((p) => toNum(p.unitsPerPresentation) > 1)
        .sort(
          (a, b) =>
            toNum(b.unitsPerPresentation) - toNum(a.unitsPerPresentation),
        )[0];
      if (boxPres) {
        await prisma.adPresentation.update({
          where: { id: boxPres.id },
          data: {
            unitsPerPresentation: dec(input.unitsPerBox),
            name: `Caja x${input.unitsPerBox}`,
            active: true,
          },
        });
      }
    }

    const packMode =
      input.packMode ??
      (input.unitsPerBox !== undefined && input.unitsPerBox > 1 ? "BOX" : undefined);

    if (packMode === "BOX") {
      const existingBox = existing.presentations.find(
        (p) => toNum(p.unitsPerPresentation) > 1,
      );
      const upp = Math.max(
        2,
        Number(input.unitsPerBox) ||
          (existingBox ? toNum(existingBox.unitsPerPresentation) : 0) ||
          2,
      );
      const unitPres = existing.presentations.find(
        (p) => toNum(p.unitsPerPresentation) === 1,
      );
      if (!unitPres) {
        await prisma.adPresentation.create({
          data: {
            productId,
            name: "Unidad",
            code: "U",
            unitsPerPresentation: dec(1),
            priceUsd: dec(0),
            priceBs: dec(0),
            active: true,
          },
        });
      }
      const boxPres = existing.presentations.find(
        (p) => toNum(p.unitsPerPresentation) > 1,
      );
      if (!boxPres) {
        await prisma.adPresentation.create({
          data: {
            productId,
            name: `Caja x${upp}`,
            code: "CAJA",
            unitsPerPresentation: dec(upp),
            priceUsd: dec(0),
            priceBs: dec(0),
            active: true,
          },
        });
      }
    }

    if (packMode === "UNIT") {
      await prisma.adPresentation.updateMany({
        where: {
          productId,
          unitsPerPresentation: { gt: 1 },
        },
        data: { active: false },
      });
    }

    const refreshed = await prisma.adProduct.findFirst({
      where: { id: productId, tenantId: ctx.tenantId },
      include: { presentations: true, category: true },
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "update",
      entity: "product",
      entityId: productId,
      before,
      after: refreshed ?? product,
    });
    return refreshed ?? product;
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

  async updatePresentation(
    ctx: AdRequestContext,
    productId: string,
    presentationId: string,
    input: {
      name?: string;
      code?: string | null;
      unitsPerPresentation?: number;
      active?: boolean;
      sku?: string | null;
      barcode?: string | null;
    },
  ) {
    requireAdPermission(ctx, "products.manage");
    const prisma = getPrisma();
    const product = await prisma.adProduct.findFirst({
      where: { id: productId, tenantId: ctx.tenantId },
    });
    if (!product) throw new NotFoundError("Producto no encontrado");

    const existing = await prisma.adPresentation.findFirst({
      where: { id: presentationId, productId },
    });
    if (!existing) throw new NotFoundError("Presentación no encontrada");

    const presentation = await prisma.adPresentation.update({
      where: { id: presentationId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.unitsPerPresentation !== undefined
          ? { unitsPerPresentation: dec(input.unitsPerPresentation) }
          : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.sku !== undefined ? { sku: input.sku } : {}),
        ...(input.barcode !== undefined ? { barcode: input.barcode } : {}),
      },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "update",
      entity: "presentation",
      entityId: presentation.id,
      before: existing,
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
    requireAdAnyPermission(ctx, ["clients.read", "pos.sell"]);
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
      continueWithShortage?: boolean;
      shortageReasonCode?: string;
      shortageReasonNote?: string;
      shortageDecision?: string;
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
          avgCostUsd: toNum(p.product.avgCostUsd),
          avgCostBs: toNum(p.product.avgCostBs),
        },
      ]),
    );

    const lineSnapshots = buildSaleLineSnapshots(input.lines, presentationMap);
    const totals = sumSaleTotals(lineSnapshots);

    const bcvAtSale = await prisma.adExchangeRate.findFirst({
      where: { tenantId: ctx.tenantId, kind: "BCV" },
      orderBy: { effectiveAt: "desc" },
    });
    const bcvRateAtSale = bcvAtSale ? toNum(bcvAtSale.rate) : null;

    /** Disponibilidad operativa: compromiso activo NO es stock físico. */
    const productIds = [...new Set(lineSnapshots.map((l) => l.productId))];
    const [stocks, accounts, allPresentations, transfers, commitments] =
      await Promise.all([
        prisma.adStock.findMany({
          where: { warehouseId, productId: { in: productIds } },
        }),
        prisma.adAccount.findMany({
          where: { tenantId: ctx.tenantId, warehouseId },
          include: { lines: true },
        }),
        prisma.adPresentation.findMany({
          where: { product: { tenantId: ctx.tenantId } },
        }),
        prisma.adStockTransfer.findMany({
          where: { tenantId: ctx.tenantId, fromWarehouseId: warehouseId },
          include: { lines: true },
        }),
        prisma.adCustomerCommitment.findMany({
          where: {
            tenantId: ctx.tenantId,
            status: "PENDIENTE",
            productId: { in: productIds },
          },
        }),
      ]);

    const shortageLines: {
      productId: string;
      requestedBase: number;
      availableOperational: number;
      physical: number;
      shortfall: number;
    }[] = [];

    for (const productId of productIds) {
      const requestedBase = lineSnapshots
        .filter((l) => l.productId === productId)
        .reduce((a, l) => a + l.qtyBase, 0);
      const av = computeOperationalAvailability({
        productId,
        stocks: stocks.map((s) => ({
          warehouseId: s.warehouseId,
          productId: s.productId,
          qtyBase: toNum(s.qtyBase),
        })),
        accounts: accounts.map((a) => ({
          status: a.status,
          warehouseId: a.warehouseId,
          lines: a.lines.map((l) => ({
            productId: l.productId,
            presentationId: l.presentationId,
            qtyOrdered: toNum(l.qtyOrdered),
            qtyServed: toNum(l.qtyServed),
          })),
        })),
        presentations: allPresentations.map((p) => ({
          id: p.id,
          unitsPerPresentation: toNum(p.unitsPerPresentation),
        })),
        transfers: transfers.map((t) => ({
          status: t.status,
          fromWarehouseId: t.fromWarehouseId,
          lines: t.lines.map((l) => ({
            productId: l.productId,
            presentationId: l.presentationId ?? "",
            qty: toNum(l.qty),
            qtyBase: toNum(l.qtyBase),
          })),
        })),
        commitments: commitments.map((c) => ({
          productId: c.productId,
          status: c.status,
          qtyBaseRemaining: toNum(c.qtyBaseRemaining),
        })),
        warehouseIds: [warehouseId],
        preferredWarehouseId: warehouseId,
        requestedBase,
      });
      const wh = av.byWarehouse.find((w) => w.warehouseId === warehouseId);
      const availableOperational = wh?.availableOperational ?? 0;
      const physical = wh?.physical ?? 0;
      if (requestedBase > availableOperational) {
        shortageLines.push({
          productId,
          requestedBase,
          availableOperational,
          physical,
          shortfall: requestedBase - availableOperational,
        });
      }
    }

    if (shortageLines.length > 0) {
      if (!input.continueWithShortage) {
        throw new ValidationError(
          `La operación supera la disponibilidad operativa. Se requiere pos.shortage_override + motivo para continuar.`,
        );
      }
      if (!hasAdPermission(ctx, "pos.shortage_override")) {
        throw new ForbiddenError("Permiso A&D requerido: pos.shortage_override");
      }
      const reasonCode =
        input.shortageReasonCode ?? input.shortageDecision ?? "";
      if (!reasonCode.trim()) {
        throw new ValidationError(
          "Motivo obligatorio para override de faltante (shortageReasonCode)",
        );
      }
    }

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
            `Stock físico insuficiente para producto ${line.productId}`,
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

      const created = await tx.adSale.create({
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
              unitCostUsdSnapshot: dec(line.unitCostUsdSnapshot),
              unitCostBsSnapshot: dec(line.unitCostBsSnapshot),
              lineCostUsdSnapshot: dec(line.lineCostUsdSnapshot),
              lineCostBsSnapshot: dec(line.lineCostBsSnapshot),
              costCurrency: "USD" as const,
              cppUsdSnapshot: dec(line.cppUsdSnapshot),
              cppBsSnapshot: dec(line.cppBsSnapshot),
              costSource: line.costSource,
              costSnapshotAt: new Date(),
              bcvRateAtSale:
                bcvRateAtSale != null ? dec(bcvRateAtSale) : undefined,
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

      /** Fase 7 — ingreso a cuenta financiera según método de pago. */
      if (created.payments.length) {
        const { postConfirmedMovement, resolveAccountForPaymentMethod } =
          await import("./finance-ledger.js");
        for (const pay of created.payments) {
          const resolved = await resolveAccountForPaymentMethod(
            tx,
            ctx.tenantId,
            {
              methodName: pay.method,
              currency: pay.currency as "USD" | "BS",
            },
          );
          if (!resolved?.account) continue;
          const mov = await postConfirmedMovement(tx, {
            tenantId: ctx.tenantId,
            type: "INGRESO_VENTA",
            accountId: resolved.account.id,
            currency: pay.currency as "USD" | "BS",
            amount: toNum(pay.amount),
            concept: `Venta ${receiptNumber}`,
            reference: pay.reference,
            relatedEntity: "sale",
            relatedId: created.id,
            saleId: created.id,
            operatorId: ctx.operator.id,
            warehouseId,
          });
          await tx.adSalePayment.update({
            where: { id: pay.id },
            data: {
              paymentMethodId: resolved.method.id,
              financialAccountId: resolved.account.id,
              financialMovementId: mov.id,
            },
          });
        }
      }

      return tx.adSale.findUniqueOrThrow({
        where: { id: created.id },
        include: { lines: true, payments: true },
      });
    });

    if (shortageLines.length > 0 && input.continueWithShortage) {
      await writeAdAudit({
        tenantId: ctx.tenantId,
        operatorId: ctx.operator.id,
        warehouseId,
        action: "shortage_override",
        entity: "sale",
        entityId: sale.id,
        detail:
          input.shortageReasonCode ??
          input.shortageDecision ??
          "shortage_override",
        after: {
          reasonCode: input.shortageReasonCode ?? input.shortageDecision,
          reasonNote: input.shortageReasonNote,
          shortageLines,
        },
      });
    }

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      warehouseId,
      action: "create",
      entity: "sale",
      entityId: sale.id,
      detail: sale.receiptNumber,
      after: {
        totalUsd: toNum(sale.totalUsd),
        totalBs: toNum(sale.totalBs),
        lines: sale.lines,
        withShortage: shortageLines.length > 0,
      },
    });

    return sale;
  },

  async voidSale(
    ctx: AdRequestContext,
    saleId: string,
    input: { reason: string },
  ) {
    requireAdPermission(ctx, "pos.refund");
    if (!input.reason.trim()) {
      throw new ValidationError("Motivo obligatorio para anular venta");
    }
    const prisma = getPrisma();

    const voided = await prisma.$transaction(async (tx) => {
      const sale = await tx.adSale.findFirst({
        where: { id: saleId, tenantId: ctx.tenantId },
        include: { lines: true },
      });
      if (!sale) throw new NotFoundError("Venta no encontrada");
      if (sale.status === "voided") {
        throw new ValidationError("Venta ya anulada");
      }
      requireWarehouseAccess(ctx, sale.warehouseId);

      const before = {
        status: sale.status,
        totalUsd: toNum(sale.totalUsd),
        lines: sale.lines.map((l) => ({
          productId: l.productId,
          qtyBase: toNum(l.qtyBase),
        })),
      };

      if (sale.status === "completed") {
        for (const line of sale.lines) {
          const qtyBase = toNum(line.qtyBase);
          if (qtyBase <= 0) continue;
          await tx.adStock.upsert({
            where: {
              warehouseId_productId: {
                warehouseId: sale.warehouseId,
                productId: line.productId,
              },
            },
            create: {
              warehouseId: sale.warehouseId,
              productId: line.productId,
              qtyBase: dec(qtyBase),
            },
            update: { qtyBase: { increment: dec(qtyBase) } },
          });
          await tx.adInventoryMovement.create({
            data: {
              warehouseId: sale.warehouseId,
              productId: line.productId,
              type: "VOID_REVERSAL",
              qtyBase: dec(qtyBase),
              presentationId: line.presentationId,
              qtyPresentation: dec(toNum(line.qty)),
              operatorId: ctx.operator.id,
              reference: sale.id,
              reason: input.reason,
            },
          });
        }
      }

      const updated = await tx.adSale.update({
        where: { id: sale.id },
        data: {
          status: "voided",
          voidedAt: new Date(),
          notes: sale.notes
            ? `${sale.notes}\n[ANULADA] ${input.reason}`
            : `[ANULADA] ${input.reason}`,
        },
        include: { lines: true, payments: true },
      });

      return { updated, before, warehouseId: sale.warehouseId };
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      warehouseId: voided.warehouseId,
      action: "void",
      entity: "sale",
      entityId: voided.updated.id,
      detail: input.reason,
      before: voided.before,
      after: { status: "voided", reason: input.reason },
    });

    return voided.updated;
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

  async cleanupDemoData(ctx: AdRequestContext, confirm: string) {
    requireAdPermission(ctx, "settings.manage");
    if (confirm !== "BORRAR-DATOS-DEMO") {
      throw new ValidationError(
        'Confirmación requerida: envíe { "confirm": "BORRAR-DATOS-DEMO" }',
      );
    }
    const prisma = getPrisma();
    const before = {
      products: await prisma.adProduct.count({ where: { tenantId: ctx.tenantId } }),
      customers: await prisma.adCustomer.count({ where: { tenantId: ctx.tenantId } }),
      operators: await prisma.adOperator.count({ where: { tenantId: ctx.tenantId } }),
      tables: await prisma.adTableSpace.count({ where: { tenantId: ctx.tenantId } }),
      suppliers: await prisma.adSupplier.count({ where: { tenantId: ctx.tenantId } }),
    };
    const deleted = await cleanupAdLicoreriaDemoData(prisma, ctx.tenantId);
    const after = {
      products: await prisma.adProduct.count({ where: { tenantId: ctx.tenantId } }),
      customers: await prisma.adCustomer.count({ where: { tenantId: ctx.tenantId } }),
      operators: await prisma.adOperator.count({ where: { tenantId: ctx.tenantId } }),
      tables: await prisma.adTableSpace.count({ where: { tenantId: ctx.tenantId } }),
      suppliers: await prisma.adSupplier.count({ where: { tenantId: ctx.tenantId } }),
    };
    return { before, after, deleted };
  },
};
