import { Prisma } from "@prisma/client";
import { getPrisma } from "../config/database.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../errors/app-error.js";
import {
  requireAdPermission,
  requireWarehouseAccess,
  resolveEffectiveWarehouseId,
  type AdRequestContext,
} from "./authorization.js";
import {
  avgDailyFromWindow,
  priceFromUtility,
  suggestReplenishment,
  utilityFromPrice,
} from "./commerce-domain.js";
import {
  aggregateBuiltLines,
  buildPurchaseLineFromPresentation,
  moneyDoc,
  type RawPurchaseLineInput,
} from "./commerce-purchase.js";
import { weightedAverageCost } from "./availability.js";
import { writeAdAudit } from "./service.js";

function dec(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n);
}

function num(v: Prisma.Decimal | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

async function latestRate(
  tenantId: string,
  kind: "BCV" | "PROTECTED",
): Promise<number | null> {
  const prisma = getPrisma();
  const row = await prisma.adExchangeRate.findFirst({
    where: { tenantId, kind },
    orderBy: { effectiveAt: "desc" },
  });
  return row ? num(row.rate) : null;
}

function sanitizePurchaseForClient<T extends Record<string, unknown>>(
  purchase: T,
): T {
  const copy = { ...purchase };
  delete (copy as { protectedRateSnapshot?: unknown }).protectedRateSnapshot;
  return copy;
}

export const adCommerceService = {
  /** Búsqueda global de productos (código, barcode, nombre, marca…). */
  async searchProducts(
    ctx: AdRequestContext,
    query: {
      q?: string;
      sku?: string;
      barcode?: string;
      brand?: string;
      warehouseId?: string;
      active?: "true" | "false" | "all";
      limit?: number;
    },
  ) {
    requireAdPermission(ctx, "inventory.read");
    const prisma = getPrisma();
    const limit = query.limit ?? 40;
    const activeFilter =
      query.active === "false"
        ? false
        : query.active === "all"
          ? undefined
          : true;

    const warehouseId = resolveEffectiveWarehouseId(
      ctx.operator,
      query.warehouseId,
    );
    if (query.warehouseId) requireWarehouseAccess(ctx, query.warehouseId);

    const or: Prisma.AdProductWhereInput[] = [];
    const q = query.q?.trim();
    if (q) {
      or.push(
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q, mode: "insensitive" } },
        {
          presentations: {
            some: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { sku: { contains: q, mode: "insensitive" } },
                { barcode: { contains: q, mode: "insensitive" } },
                { code: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
      );
    }
    if (query.sku) {
      or.push({ sku: { equals: query.sku, mode: "insensitive" } });
    }
    if (query.barcode) {
      or.push(
        { barcode: { equals: query.barcode, mode: "insensitive" } },
        {
          presentations: {
            some: { barcode: { equals: query.barcode, mode: "insensitive" } },
          },
        },
      );
    }
    if (query.brand) {
      or.push({ brand: { contains: query.brand, mode: "insensitive" } });
    }

    const products = await prisma.adProduct.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(activeFilter === undefined ? {} : { active: activeFilter }),
        ...(or.length ? { OR: or } : {}),
      },
      include: {
        presentations: { where: { active: true } },
        stocks: warehouseId
          ? { where: { warehouseId } }
          : true,
        category: true,
      },
      take: limit,
      orderBy: { name: "asc" },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      sku: p.sku,
      barcode: p.barcode,
      description: p.description,
      active: p.active,
      avgCostUsd: num(p.avgCostUsd),
      avgCostBs: num(p.avgCostBs),
      category: p.category,
      presentations: p.presentations.map((pr) => ({
        id: pr.id,
        name: pr.name,
        code: pr.code,
        sku: pr.sku,
        barcode: pr.barcode,
        unitsPerPresentation: num(pr.unitsPerPresentation),
        priceUsd: num(pr.priceUsd),
        priceBs: num(pr.priceBs),
      })),
      stockByWarehouse: p.stocks.map((s) => ({
        warehouseId: s.warehouseId,
        qtyBase: num(s.qtyBase),
      })),
    }));
  },

  /**
   * Contrato de escaneo: code + source (manual|camera|wedge).
   * No integra hardware; solo resuelve producto.
   */
  async lookupByCode(
    ctx: AdRequestContext,
    input: { code: string; source?: "manual" | "camera" | "wedge" },
  ) {
    requireAdPermission(ctx, "inventory.read");
    const code = input.code.trim();
    if (!code) throw new ValidationError("Código requerido");
    const hits = await this.searchProducts(ctx, {
      barcode: code,
      limit: 5,
      active: "true",
    });
    if (!hits.length) {
      const bySku = await this.searchProducts(ctx, {
        sku: code,
        limit: 5,
        active: "true",
      });
      return {
        code,
        source: input.source ?? "manual",
        matches: bySku,
      };
    }
    return { code, source: input.source ?? "manual", matches: hits };
  },

  async listSuppliers(ctx: AdRequestContext) {
    requireAdPermission(ctx, "suppliers.manage");
    const prisma = getPrisma();
    return prisma.adSupplier.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { name: "asc" },
    });
  },

  async createSupplier(
    ctx: AdRequestContext,
    input: {
      name: string;
      identification?: string;
      phone?: string;
      contactName?: string;
      address?: string;
      email?: string;
      defaultCurrency?: "USD" | "BS";
      creditDays?: number;
      creditLimit?: number;
      notes?: string;
      active?: boolean;
    },
  ) {
    requireAdPermission(ctx, "suppliers.manage");
    const prisma = getPrisma();
    const supplier = await prisma.adSupplier.create({
      data: {
        tenantId: ctx.tenantId,
        name: input.name,
        identification: input.identification,
        phone: input.phone,
        contactName: input.contactName,
        address: input.address,
        email: input.email || null,
        defaultCurrency: input.defaultCurrency ?? "USD",
        creditDays: input.creditDays ?? 0,
        creditLimit: dec(input.creditLimit ?? 0),
        notes: input.notes,
        active: input.active ?? true,
      },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "create",
      entity: "supplier",
      entityId: supplier.id,
      after: supplier,
    });
    return supplier;
  },

  async updateSupplier(
    ctx: AdRequestContext,
    id: string,
    input: Partial<{
      name: string;
      identification: string;
      phone: string;
      contactName: string;
      address: string;
      email: string;
      defaultCurrency: "USD" | "BS";
      creditDays: number;
      creditLimit: number;
      notes: string;
      active: boolean;
    }>,
  ) {
    requireAdPermission(ctx, "suppliers.manage");
    const prisma = getPrisma();
    const before = await prisma.adSupplier.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });
    if (!before) throw new NotFoundError("Proveedor no encontrado");
    const after = await prisma.adSupplier.update({
      where: { id },
      data: {
        name: input.name,
        identification: input.identification,
        phone: input.phone,
        contactName: input.contactName,
        address: input.address,
        email: input.email === "" ? null : input.email,
        defaultCurrency: input.defaultCurrency,
        creditDays: input.creditDays,
        creditLimit:
          input.creditLimit !== undefined ? dec(input.creditLimit) : undefined,
        notes: input.notes,
        active: input.active,
      },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "update",
      entity: "supplier",
      entityId: id,
      before,
      after,
    });
    return after;
  },

  async getSupplierDetail(ctx: AdRequestContext, id: string) {
    requireAdPermission(ctx, "suppliers.manage");
    const prisma = getPrisma();
    const supplier = await prisma.adSupplier.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        purchases: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { lines: true },
        },
        payables: { orderBy: { dueDate: "asc" } },
      },
    });
    if (!supplier) throw new NotFoundError("Proveedor no encontrado");
    const productIds = new Set<string>();
    let costSum = 0;
    let costCount = 0;
    for (const p of supplier.purchases) {
      for (const l of p.lines) {
        productIds.add(l.productId);
        costSum += num(l.effectiveUnitCostUsd) || num(l.unitCostUsd);
        costCount += 1;
      }
    }
    return {
      ...supplier,
      productsSuppliedCount: productIds.size,
      averageUnitCostUsd: costCount ? costSum / costCount : 0,
      lastPurchaseAt: supplier.purchases[0]?.createdAt ?? null,
      openPayables: supplier.payables.filter((p) =>
        ["PENDIENTE", "PARCIAL", "VENCIDA"].includes(p.status),
      ),
    };
  },

  async createPurchase(
    ctx: AdRequestContext,
    input: {
      warehouseId: string;
      supplierId?: string;
      supplierName?: string;
      invoiceNumber: string;
      invoiceDate?: string;
      currency: "USD" | "BS";
      paymentMethodId?: string;
      paymentCondition: "CONTADO" | "CREDITO";
      creditDays?: number;
      dueDate?: string;
      reference?: string;
      notes?: string;
      useProtectedRateRef?: boolean;
      /** F6: siempre inicia DRAFT; preliminary solo marca intención documental. */
      preliminary?: boolean;
      lines: (RawPurchaseLineInput & { taxable?: boolean; taxRate?: number })[];
    },
  ) {
    requireAdPermission(ctx, "purchases.create");
    const warehouseId = resolveEffectiveWarehouseId(
      ctx.operator,
      input.warehouseId,
    );
    if (!warehouseId) throw new ValidationError("Depósito destino obligatorio");
    requireWarehouseAccess(ctx, warehouseId);

    const prisma = getPrisma();
    let supplierName = input.supplierName?.trim() ?? "";
    if (input.supplierId) {
      const supplier = await prisma.adSupplier.findFirst({
        where: { id: input.supplierId, tenantId: ctx.tenantId },
      });
      if (!supplier) throw new NotFoundError("Proveedor no encontrado");
      supplierName = supplier.name;
    }
    if (!supplierName) throw new ValidationError("Proveedor requerido");
    if (!input.lines?.length) {
      throw new ValidationError("Agregue al menos un producto");
    }

    let useProtected = Boolean(input.useProtectedRateRef);
    if (input.paymentMethodId) {
      const pm = await prisma.adPaymentMethod.findFirst({
        where: { id: input.paymentMethodId, tenantId: ctx.tenantId },
      });
      if (pm?.usesSpecialRateRef) useProtected = true;
    }

    const bcv = await latestRate(ctx.tenantId, "BCV");
    const protectedRate = await latestRate(ctx.tenantId, "PROTECTED");
    if (useProtected) {
      requireAdPermission(ctx, "rates.protected.manage");
      if (!protectedRate || !bcv) {
        throw new ValidationError(
          "Tasa BCV y tasa protegida requeridas para referencia especial",
        );
      }
    }

    const built = [];
    for (const raw of input.lines) {
      const pres = await prisma.adPresentation.findUniqueOrThrow({
        where: { id: raw.presentationId },
        include: { product: true },
      });
      if (pres.product.tenantId !== ctx.tenantId) {
        throw new ForbiddenError("Presentación fuera del tenant");
      }
      built.push(
        buildPurchaseLineFromPresentation(pres, raw, {
          tenantId: ctx.tenantId,
          useProtected,
          protectedRate,
          bcv,
          currency: input.currency,
        }),
      );
    }
    const agg = aggregateBuiltLines(built);

    const invoiceDate = input.invoiceDate
      ? new Date(input.invoiceDate)
      : new Date();
    let dueDate: Date | null = input.dueDate ? new Date(input.dueDate) : null;
    const creditDays = input.creditDays ?? 0;
    if (input.paymentCondition === "CREDITO" && !dueDate && creditDays > 0) {
      dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + creditDays);
    }

    /** F6: borrador hasta totalizar/confirmar — no inventario ni CxP aún. */
    const purchase = await prisma.adPurchase.create({
      data: {
        tenantId: ctx.tenantId,
        warehouseId,
        supplierId: input.supplierId,
        supplierName,
        invoiceNumber: input.invoiceNumber,
        invoiceDate,
        status: "DRAFT",
        currency: input.currency,
        paymentMethodId: input.paymentMethodId,
        paymentCondition: input.paymentCondition,
        creditDays: creditDays || null,
        dueDate,
        reference: input.reference,
        notes: input.notes,
        bcvRateSnapshot: bcv != null ? dec(bcv) : undefined,
        protectedRateSnapshot:
          useProtected && protectedRate != null ? dec(protectedRate) : undefined,
        useProtectedRateRef: useProtected,
        totalCostUsd: dec(agg.totalEffectiveUsd),
        totalCostBs: dec(agg.totalEffectiveBs),
        totalInvoicedUsd: dec(agg.totalInvoicedUsd),
        totalInvoicedBs: dec(agg.totalInvoicedBs),
        subtotalUsd: dec(agg.subtotalUsd),
        subtotalBs: dec(agg.subtotalBs),
        taxUsd: dec(agg.taxUsd),
        taxBs: dec(agg.taxBs),
        grandTotalUsd: dec(agg.grandTotalUsd),
        grandTotalBs: dec(agg.grandTotalBs),
        createdById: ctx.operator.id,
        lines: { create: built.map((b) => b.data) },
      },
      include: {
        lines: { include: { product: true, presentation: true } },
        supplier: true,
        paymentMethod: true,
      },
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      warehouseId,
      action: "create",
      entity: "purchase",
      entityId: purchase.id,
      after: sanitizePurchaseForClient({
        status: purchase.status,
        subtotalUsd: num(purchase.subtotalUsd),
        taxUsd: num(purchase.taxUsd),
        grandTotalUsd: num(purchase.grandTotalUsd),
        lines: purchase.lines.length,
      }),
    });

    return {
      ...sanitizePurchaseForClient(
        purchase as unknown as Record<string, unknown>,
      ),
      totals: {
        subtotal: num(
          input.currency === "BS" ? purchase.subtotalBs : purchase.subtotalUsd,
        ),
        tax: num(input.currency === "BS" ? purchase.taxBs : purchase.taxUsd),
        grandTotal: num(
          input.currency === "BS"
            ? purchase.grandTotalBs
            : purchase.grandTotalUsd,
        ),
      },
    };
  },

  async getPurchase(ctx: AdRequestContext, purchaseId: string) {
    requireAdPermission(ctx, "purchases.create");
    const prisma = getPrisma();
    const purchase = await prisma.adPurchase.findFirst({
      where: { id: purchaseId, tenantId: ctx.tenantId },
      include: {
        lines: { include: { product: true, presentation: true } },
        supplier: true,
        paymentMethod: true,
        payable: true,
      },
    });
    if (!purchase) throw new NotFoundError("Compra no encontrada");
    requireWarehouseAccess(ctx, purchase.warehouseId);
    return {
      ...sanitizePurchaseForClient(
        purchase as unknown as Record<string, unknown>,
      ),
      ...moneyDoc(purchase),
      totals: {
        subtotal: num(
          purchase.currency === "BS"
            ? purchase.subtotalBs
            : purchase.subtotalUsd,
        ),
        tax: num(
          purchase.currency === "BS" ? purchase.taxBs : purchase.taxUsd,
        ),
        grandTotal: num(
          purchase.currency === "BS"
            ? purchase.grandTotalBs
            : purchase.grandTotalUsd,
        ),
      },
    };
  },

  async recalculatePurchaseTotals(
    tx: Prisma.TransactionClient,
    purchaseId: string,
  ) {
    const lines = await tx.adPurchaseLine.findMany({ where: { purchaseId } });
    let subtotalUsd = 0,
      taxUsd = 0,
      subtotalBs = 0,
      taxBs = 0,
      effUsd = 0,
      effBs = 0;
    for (const l of lines) {
      subtotalUsd += num(l.lineCostUsd);
      taxUsd += num(l.lineTaxUsd);
      subtotalBs += num(l.lineCostBs);
      taxBs += num(l.lineTaxBs);
      effUsd += num(l.effectiveUnitCostUsd) * num(l.qtyReceivedBase);
      effBs += num(l.effectiveUnitCostBs) * num(l.qtyReceivedBase);
    }
    return tx.adPurchase.update({
      where: { id: purchaseId },
      data: {
        subtotalUsd: dec(subtotalUsd),
        taxUsd: dec(taxUsd),
        grandTotalUsd: dec(subtotalUsd + taxUsd),
        subtotalBs: dec(subtotalBs),
        taxBs: dec(taxBs),
        grandTotalBs: dec(subtotalBs + taxBs),
        totalInvoicedUsd: dec(subtotalUsd),
        totalInvoicedBs: dec(subtotalBs),
        totalCostUsd: dec(effUsd),
        totalCostBs: dec(effBs),
      },
      include: {
        lines: { include: { product: true, presentation: true } },
        supplier: true,
        paymentMethod: true,
      },
    });
  },

  async addPurchaseLine(
    ctx: AdRequestContext,
    purchaseId: string,
    raw: RawPurchaseLineInput & { taxable?: boolean; taxRate?: number },
  ) {
    requireAdPermission(ctx, "purchases.create");
    const prisma = getPrisma();
    const purchase = await prisma.adPurchase.findFirst({
      where: { id: purchaseId, tenantId: ctx.tenantId },
    });
    if (!purchase) throw new NotFoundError("Compra no encontrada");
    if (purchase.status !== "DRAFT" && purchase.status !== "PRELIMINARY") {
      throw new ValidationError("Solo se editan compras en borrador/preliminar");
    }
    requireWarehouseAccess(ctx, purchase.warehouseId);

    const pres = await prisma.adPresentation.findUniqueOrThrow({
      where: { id: raw.presentationId },
      include: { product: true },
    });
    const built = buildPurchaseLineFromPresentation(pres, raw, {
      tenantId: ctx.tenantId,
      useProtected: purchase.useProtectedRateRef,
      protectedRate: purchase.protectedRateSnapshot
        ? num(purchase.protectedRateSnapshot)
        : null,
      bcv: purchase.bcvRateSnapshot ? num(purchase.bcvRateSnapshot) : null,
      currency: purchase.currency as "USD" | "BS",
    });

    await prisma.$transaction(async (tx) => {
      await tx.adPurchaseLine.create({
        data: { ...built.data, purchaseId },
      });
      if (purchase.status === "PRELIMINARY") {
        await tx.adPurchase.update({
          where: { id: purchaseId },
          data: { status: "DRAFT" },
        });
      }
      await this.recalculatePurchaseTotals(tx, purchaseId);
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      warehouseId: purchase.warehouseId,
      action: "add_line",
      entity: "purchase",
      entityId: purchaseId,
      after: { presentationId: raw.presentationId, qty: raw.qty },
    });
    return this.getPurchase(ctx, purchaseId);
  },

  async updatePurchaseLine(
    ctx: AdRequestContext,
    purchaseId: string,
    lineId: string,
    raw: Partial<RawPurchaseLineInput> & { taxable?: boolean; taxRate?: number },
  ) {
    requireAdPermission(ctx, "purchases.create");
    const prisma = getPrisma();
    const purchase = await prisma.adPurchase.findFirst({
      where: { id: purchaseId, tenantId: ctx.tenantId },
      include: { lines: true },
    });
    if (!purchase) throw new NotFoundError("Compra no encontrada");
    if (purchase.status !== "DRAFT" && purchase.status !== "PRELIMINARY") {
      throw new ValidationError("Solo se editan compras en borrador/preliminar");
    }
    requireWarehouseAccess(ctx, purchase.warehouseId);
    const existing = purchase.lines.find((l) => l.id === lineId);
    if (!existing) throw new NotFoundError("Línea no encontrada");

    const presentationId = raw.presentationId ?? existing.presentationId;
    const pres = await prisma.adPresentation.findUniqueOrThrow({
      where: { id: presentationId },
      include: { product: true },
    });
    const merged: RawPurchaseLineInput = {
      presentationId,
      qty: raw.qty ?? num(existing.qty),
      qtyBonus: raw.qtyBonus ?? num(existing.qtyBonus),
      costMode: (raw.costMode ?? existing.costMode) as RawPurchaseLineInput["costMode"],
      unitCostUsd: raw.unitCostUsd ?? num(existing.unitCostUsd),
      unitCostBs: raw.unitCostBs ?? num(existing.unitCostBs),
      presentationCostUsd:
        raw.presentationCostUsd ?? num(existing.presentationCostUsd),
      presentationCostBs:
        raw.presentationCostBs ?? num(existing.presentationCostBs),
      lineTotalUsd: raw.lineTotalUsd ?? num(existing.lineCostUsd),
      lineTotalBs: raw.lineTotalBs ?? num(existing.lineCostBs),
      taxable: raw.taxable ?? existing.taxable,
      taxRate: raw.taxRate ?? num(existing.taxRate),
    };
    const built = buildPurchaseLineFromPresentation(pres, merged, {
      tenantId: ctx.tenantId,
      useProtected: purchase.useProtectedRateRef,
      protectedRate: purchase.protectedRateSnapshot
        ? num(purchase.protectedRateSnapshot)
        : null,
      bcv: purchase.bcvRateSnapshot ? num(purchase.bcvRateSnapshot) : null,
      currency: purchase.currency as "USD" | "BS",
    });

    const before = {
      qty: num(existing.qty),
      unitCostUsd: num(existing.unitCostUsd),
      taxable: existing.taxable,
      qtyBonus: num(existing.qtyBonus),
    };

    await prisma.$transaction(async (tx) => {
      await tx.adPurchaseLine.update({
        where: { id: lineId },
        data: built.data,
      });
      if (purchase.status === "PRELIMINARY") {
        await tx.adPurchase.update({
          where: { id: purchaseId },
          data: { status: "DRAFT" },
        });
      }
      await this.recalculatePurchaseTotals(tx, purchaseId);
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      warehouseId: purchase.warehouseId,
      action: "update_line",
      entity: "purchase_line",
      entityId: lineId,
      before,
      after: {
        qty: merged.qty,
        unitCostUsd: merged.unitCostUsd,
        taxable: merged.taxable,
        qtyBonus: merged.qtyBonus,
      },
    });
    return this.getPurchase(ctx, purchaseId);
  },

  async deletePurchaseLine(
    ctx: AdRequestContext,
    purchaseId: string,
    lineId: string,
  ) {
    requireAdPermission(ctx, "purchases.create");
    const prisma = getPrisma();
    const purchase = await prisma.adPurchase.findFirst({
      where: { id: purchaseId, tenantId: ctx.tenantId },
      include: { lines: true },
    });
    if (!purchase) throw new NotFoundError("Compra no encontrada");
    if (purchase.status !== "DRAFT" && purchase.status !== "PRELIMINARY") {
      throw new ValidationError("Solo se editan compras en borrador/preliminar");
    }
    requireWarehouseAccess(ctx, purchase.warehouseId);
    const existing = purchase.lines.find((l) => l.id === lineId);
    if (!existing) throw new NotFoundError("Línea no encontrada");

    await prisma.$transaction(async (tx) => {
      await tx.adPurchaseLine.delete({ where: { id: lineId } });
      if (purchase.status === "PRELIMINARY") {
        await tx.adPurchase.update({
          where: { id: purchaseId },
          data: { status: "DRAFT" },
        });
      }
      await this.recalculatePurchaseTotals(tx, purchaseId);
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      warehouseId: purchase.warehouseId,
      action: "delete_line",
      entity: "purchase_line",
      entityId: lineId,
      before: {
        presentationId: existing.presentationId,
        qty: num(existing.qty),
      },
    });
    return this.getPurchase(ctx, purchaseId);
  },

  /** Totalizar → PRELIMINARY (sin inventario ni CxP). */
  async totalizePurchase(ctx: AdRequestContext, purchaseId: string) {
    requireAdPermission(ctx, "purchases.create");
    const prisma = getPrisma();
    const before = await prisma.adPurchase.findFirst({
      where: { id: purchaseId, tenantId: ctx.tenantId },
      include: { lines: true },
    });
    if (!before) throw new NotFoundError("Compra no encontrada");
    if (!before.lines.length) {
      throw new ValidationError("Agregue líneas antes de totalizar");
    }
    requireWarehouseAccess(ctx, before.warehouseId);
    if (before.status !== "DRAFT" && before.status !== "PRELIMINARY") {
      throw new ValidationError("Estado no permite totalizar");
    }

    const updated = await prisma.adPurchase.update({
      where: { id: purchaseId },
      data: { status: "PRELIMINARY" },
      include: {
        lines: { include: { product: true, presentation: true } },
        supplier: true,
        paymentMethod: true,
      },
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      warehouseId: before.warehouseId,
      action: "totalize",
      entity: "purchase",
      entityId: purchaseId,
      before: { status: before.status },
      after: {
        status: "PRELIMINARY",
        subtotal: num(updated.subtotalUsd),
        tax: num(updated.taxUsd),
        grandTotal: num(updated.grandTotalUsd),
      },
    });

    return {
      ...sanitizePurchaseForClient(
        updated as unknown as Record<string, unknown>,
      ),
      ...moneyDoc(updated),
      totals: {
        subtotal: num(
          updated.currency === "BS" ? updated.subtotalBs : updated.subtotalUsd,
        ),
        tax: num(updated.currency === "BS" ? updated.taxBs : updated.taxUsd),
        grandTotal: num(
          updated.currency === "BS"
            ? updated.grandTotalBs
            : updated.grandTotalUsd,
        ),
      },
    };
  },

  /**
   * Confirmar compra F6 — transacción única:
   * inventario + kardex + CPP + CxP (total general c/IVA) + auditoría.
   */
  async confirmPurchase(
    ctx: AdRequestContext,
    purchaseId: string,
    _input: { receive?: boolean } = {},
  ) {
    requireAdPermission(ctx, "purchases.approve");
    const prisma = getPrisma();
    const before = await prisma.adPurchase.findFirst({
      where: { id: purchaseId, tenantId: ctx.tenantId },
      include: { lines: true },
    });
    if (!before) throw new NotFoundError("Compra no encontrada");
    requireWarehouseAccess(ctx, before.warehouseId);
    if (!["DRAFT", "PRELIMINARY", "ORDERED"].includes(before.status)) {
      throw new ValidationError("Compra no confirmable");
    }
    if (before.status === "RECEIVED") {
      throw new ValidationError("Compra ya confirmada/recibida");
    }
    if (!before.lines.length) {
      throw new ValidationError("Compra sin líneas");
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const line of before.lines) {
        const stock = await tx.adStock.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: before.warehouseId,
              productId: line.productId,
            },
          },
        });
        const prevQty = stock ? num(stock.qtyBase) : 0;
        const product = await tx.adProduct.findUniqueOrThrow({
          where: { id: line.productId },
        });
        const qtyIn =
          num(line.qtyReceivedBase) > 0
            ? num(line.qtyReceivedBase)
            : num(line.qtyBase);
        const unitUsd =
          num(line.effectiveUnitCostUsd) > 0
            ? num(line.effectiveUnitCostUsd)
            : num(line.unitCostUsd);
        const unitBs =
          num(line.effectiveUnitCostBs) > 0
            ? num(line.effectiveUnitCostBs)
            : num(line.unitCostBs);
        const avgUsd = weightedAverageCost(
          prevQty,
          num(product.avgCostUsd),
          qtyIn,
          unitUsd,
        );
        const avgBs = weightedAverageCost(
          prevQty,
          num(product.avgCostBs),
          qtyIn,
          unitBs,
        );
        await tx.adProduct.update({
          where: { id: line.productId },
          data: { avgCostUsd: dec(avgUsd), avgCostBs: dec(avgBs) },
        });
        await tx.adStock.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: before.warehouseId,
              productId: line.productId,
            },
          },
          create: {
            warehouseId: before.warehouseId,
            productId: line.productId,
            qtyBase: dec(qtyIn),
          },
          update: { qtyBase: { increment: dec(qtyIn) } },
        });
        await tx.adInventoryMovement.create({
          data: {
            warehouseId: before.warehouseId,
            productId: line.productId,
            type: "PURCHASE",
            qtyBase: dec(qtyIn),
            presentationId: line.presentationId,
            qtyPresentation: line.qty,
            operatorId: ctx.operator.id,
            reference: before.id,
            reason: `Recepción ${before.invoiceNumber}`,
          },
        });
      }

      const grand =
        before.currency === "BS"
          ? num(before.grandTotalBs) || num(before.totalInvoicedBs)
          : num(before.grandTotalUsd) || num(before.totalInvoicedUsd);
      const subtotal =
        before.currency === "BS"
          ? num(before.subtotalBs)
          : num(before.subtotalUsd);
      const tax =
        before.currency === "BS" ? num(before.taxBs) : num(before.taxUsd);

      const updated = await tx.adPurchase.update({
        where: { id: purchaseId },
        data: {
          status: "RECEIVED",
          receivedAt: new Date(),
          receivedById: ctx.operator.id,
        },
        include: {
          lines: { include: { product: true, presentation: true } },
          supplier: true,
          paymentMethod: true,
        },
      });

      if (before.supplierId) {
        const existingPayable = await tx.adPayable.findUnique({
          where: { purchaseId },
        });
        if (!existingPayable) {
          const isCredit = before.paymentCondition === "CREDITO";
          await tx.adPayable.create({
            data: {
              tenantId: ctx.tenantId,
              supplierId: before.supplierId,
              purchaseId,
              invoiceNumber: before.invoiceNumber,
              currency: before.currency,
              amount: dec(grand),
              subtotal: dec(subtotal),
              taxAmount: dec(tax),
              paidAmount: dec(isCredit ? 0 : grand),
              balance: dec(isCredit ? grand : 0),
              issuedAt: before.invoiceDate ?? before.createdAt,
              dueDate: before.dueDate,
              status: isCredit ? "PENDIENTE" : "PAGADA",
              warehouseId: before.warehouseId,
              paymentMethodId: before.paymentMethodId,
            },
          });
        }
      }

      return updated;
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      warehouseId: before.warehouseId,
      action: "confirm",
      entity: "purchase",
      entityId: purchaseId,
      before: {
        status: before.status,
        grandTotalUsd: num(before.grandTotalUsd),
      },
      after: {
        status: "RECEIVED",
        grandTotalUsd: num(result.grandTotalUsd),
        inventory: true,
        payable: Boolean(before.supplierId),
      },
    });

    return {
      ...sanitizePurchaseForClient(
        result as unknown as Record<string, unknown>,
      ),
      ...moneyDoc(result),
    };
  },

  /** Crear producto (+ presentación) desde el módulo de compras. */
  async createProductFromPurchase(
    ctx: AdRequestContext,
    input: {
      sku: string;
      name: string;
      brand?: string;
      categoryId?: string;
      description?: string;
      baseUnitLabel?: string;
      taxable?: boolean;
      presentationName?: string;
      unitsPerPresentation?: number;
      barcode?: string;
      priceUsd?: number;
      priceBs?: number;
    },
  ) {
    requireAdPermission(ctx, "products.manage");
    const prisma = getPrisma();
    const sku = input.sku.trim();
    if (!sku || !input.name.trim()) {
      throw new ValidationError("Código y descripción obligatorios");
    }
    const dup = await prisma.adProduct.findFirst({
      where: { tenantId: ctx.tenantId, sku: { equals: sku, mode: "insensitive" } },
    });
    if (dup) throw new ValidationError("Ya existe un producto con ese código");

    const product = await prisma.adProduct.create({
      data: {
        tenantId: ctx.tenantId,
        sku,
        name: input.name.trim(),
        brand: input.brand,
        categoryId: input.categoryId,
        description: input.description,
        baseUnitLabel: input.baseUnitLabel ?? "u",
        taxable: input.taxable ?? false,
        barcode: input.barcode,
        presentations: {
          create: {
            name: input.presentationName ?? "Unidad",
            code: "U",
            unitsPerPresentation: dec(input.unitsPerPresentation ?? 1),
            priceUsd: dec(input.priceUsd ?? 0),
            priceBs: dec(input.priceBs ?? 0),
            sku,
            barcode: input.barcode,
          },
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
      after: {
        sku: product.sku,
        name: product.name,
        taxable: product.taxable,
      },
    });
    return product;
  },

  async listPayables(ctx: AdRequestContext) {
    requireAdPermission(ctx, "payables.manage");
    const prisma = getPrisma();
    const now = new Date();
    const rows = await prisma.adPayable.findMany({
      where: { tenantId: ctx.tenantId },
      include: { supplier: true, payments: true, purchase: true },
      orderBy: { dueDate: "asc" },
    });
    return rows.map((p) => {
      let status = p.status;
      if (
        status !== "PAGADA" &&
        status !== "ANULADA" &&
        p.dueDate &&
        p.dueDate < now &&
        num(p.balance) > 0
      ) {
        status = "VENCIDA";
      }
      const daysRemaining =
        p.dueDate != null
          ? Math.ceil((p.dueDate.getTime() - now.getTime()) / 86_400_000)
          : null;
      return {
        ...p,
        status,
        daysRemaining,
        amount: num(p.amount),
        paidAmount: num(p.paidAmount),
        balance: num(p.balance),
      };
    });
  },

  async payPayable(
    ctx: AdRequestContext,
    payableId: string,
    input: {
      amount: number;
      currency: "USD" | "BS";
      paymentMethodId?: string;
      reference?: string;
      notes?: string;
    },
  ) {
    requireAdPermission(ctx, "payables.manage");
    const prisma = getPrisma();
    return prisma.$transaction(async (tx) => {
      const payable = await tx.adPayable.findFirst({
        where: { id: payableId, tenantId: ctx.tenantId },
      });
      if (!payable) throw new NotFoundError("Cuenta por pagar no encontrada");
      if (payable.status === "ANULADA" || payable.status === "PAGADA") {
        throw new ValidationError("Cuenta no admite pagos");
      }
      if (input.amount > num(payable.balance) + 1e-9) {
        throw new ValidationError("Monto supera el saldo");
      }
      await tx.adPayablePayment.create({
        data: {
          payableId,
          amount: dec(input.amount),
          currency: input.currency,
          paymentMethodId: input.paymentMethodId,
          reference: input.reference,
          notes: input.notes,
          operatorId: ctx.operator.id,
        },
      });
      const paidAmount = num(payable.paidAmount) + input.amount;
      const balance = Math.max(0, num(payable.amount) - paidAmount);
      const status =
        balance <= 0 ? "PAGADA" : paidAmount > 0 ? "PARCIAL" : payable.status;
      const updated = await tx.adPayable.update({
        where: { id: payableId },
        data: {
          paidAmount: dec(paidAmount),
          balance: dec(balance),
          status,
        },
      });
      await writeAdAudit({
        tenantId: ctx.tenantId,
        operatorId: ctx.operator.id,
        action: "payment",
        entity: "payable",
        entityId: payableId,
        before: { balance: num(payable.balance), status: payable.status },
        after: { balance, status, amount: input.amount },
      });
      return updated;
    });
  },

  async getBcvRate(ctx: AdRequestContext) {
    requireAdPermission(ctx, "inventory.read");
    const prisma = getPrisma();
    const latest = await prisma.adExchangeRate.findFirst({
      where: { tenantId: ctx.tenantId, kind: "BCV" },
      orderBy: { effectiveAt: "desc" },
    });
    const history = await prisma.adExchangeRate.findMany({
      where: { tenantId: ctx.tenantId, kind: "BCV" },
      orderBy: { effectiveAt: "desc" },
      take: 30,
    });
    return {
      current: latest
        ? {
            rate: num(latest.rate),
            effectiveAt: latest.effectiveAt,
            operatorId: latest.operatorId,
            reason: latest.reason,
          }
        : null,
      history: history.map((h) => ({
        id: h.id,
        rate: num(h.rate),
        effectiveAt: h.effectiveAt,
        operatorId: h.operatorId,
        reason: h.reason,
      })),
    };
  },

  async setBcvRate(
    ctx: AdRequestContext,
    input: { rate: number; reason?: string; effectiveAt?: string },
  ) {
    requireAdPermission(ctx, "rates.bcv.manage");
    const prisma = getPrisma();
    const before = await latestRate(ctx.tenantId, "BCV");
    const row = await prisma.adExchangeRate.create({
      data: {
        tenantId: ctx.tenantId,
        kind: "BCV",
        rate: dec(input.rate),
        reason: input.reason,
        effectiveAt: input.effectiveAt
          ? new Date(input.effectiveAt)
          : new Date(),
        operatorId: ctx.operator.id,
      },
    });
    await prisma.adTenant.update({
      where: { id: ctx.tenantId },
      data: { exchangeRateUsdToBs: dec(input.rate) },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "update",
      entity: "rate_bcv",
      entityId: row.id,
      before: { rate: before },
      after: { rate: input.rate, reason: input.reason },
    });
    return {
      rate: num(row.rate),
      effectiveAt: row.effectiveAt,
      operatorId: row.operatorId,
    };
  },

  /** Solo usuarios autorizados — no listar en dashboards. */
  async getProtectedRate(ctx: AdRequestContext) {
    requireAdPermission(ctx, "rates.protected.manage");
    const latest = await latestRate(ctx.tenantId, "PROTECTED");
    const prisma = getPrisma();
    const history = await prisma.adExchangeRate.findMany({
      where: { tenantId: ctx.tenantId, kind: "PROTECTED" },
      orderBy: { effectiveAt: "desc" },
      take: 20,
    });
    return {
      current: latest,
      history: history.map((h) => ({
        id: h.id,
        rate: num(h.rate),
        effectiveAt: h.effectiveAt,
        reason: h.reason,
        operatorId: h.operatorId,
      })),
    };
  },

  async setProtectedRate(
    ctx: AdRequestContext,
    input: { rate: number; reason?: string; effectiveAt?: string },
  ) {
    requireAdPermission(ctx, "rates.protected.manage");
    const prisma = getPrisma();
    const before = await latestRate(ctx.tenantId, "PROTECTED");
    const row = await prisma.adExchangeRate.create({
      data: {
        tenantId: ctx.tenantId,
        kind: "PROTECTED",
        rate: dec(input.rate),
        reason: input.reason,
        effectiveAt: input.effectiveAt
          ? new Date(input.effectiveAt)
          : new Date(),
        operatorId: ctx.operator.id,
      },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "update",
      entity: "rate_protected",
      entityId: row.id,
      before: { rate: before },
      after: { rate: input.rate, reason: input.reason },
    });
    return {
      rate: num(row.rate),
      effectiveAt: row.effectiveAt,
    };
  },

  async listPaymentMethods(ctx: AdRequestContext) {
    requireAdPermission(ctx, "inventory.read");
    const prisma = getPrisma();
    const rows = await prisma.adPaymentMethod.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    // Nunca filtrar usesSpecialRateRef del admin; sí ocultar significado en UI.
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      currency: r.currency,
      active: r.active,
      accountLabel: r.accountLabel,
      usesSpecialRateRef: r.usesSpecialRateRef,
      requiresReference: r.requiresReference,
      sortOrder: r.sortOrder,
    }));
  },

  async upsertPaymentMethod(
    ctx: AdRequestContext,
    input: {
      code: string;
      name: string;
      currency: "USD" | "BS";
      active?: boolean;
      accountLabel?: string;
      usesSpecialRateRef?: boolean;
      requiresReference?: boolean;
      sortOrder?: number;
    },
  ) {
    requireAdPermission(ctx, "settings.manage");
    const prisma = getPrisma();
    const before = await prisma.adPaymentMethod.findUnique({
      where: {
        tenantId_code: { tenantId: ctx.tenantId, code: input.code },
      },
    });
    const row = await prisma.adPaymentMethod.upsert({
      where: {
        tenantId_code: { tenantId: ctx.tenantId, code: input.code },
      },
      create: {
        tenantId: ctx.tenantId,
        code: input.code,
        name: input.name,
        currency: input.currency,
        active: input.active ?? true,
        accountLabel: input.accountLabel,
        usesSpecialRateRef: input.usesSpecialRateRef ?? false,
        requiresReference: input.requiresReference ?? false,
        sortOrder: input.sortOrder ?? 0,
      },
      update: {
        name: input.name,
        currency: input.currency,
        active: input.active,
        accountLabel: input.accountLabel,
        usesSpecialRateRef: input.usesSpecialRateRef,
        requiresReference: input.requiresReference,
        sortOrder: input.sortOrder,
      },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: before ? "update" : "create",
      entity: "payment_method",
      entityId: row.id,
      before,
      after: row,
    });
    return row;
  },

  async setPresentationPrice(
    ctx: AdRequestContext,
    input: {
      presentationId: string;
      kind: "NORMAL" | "PROMOCION" | "ESPECIAL" | "METODO_PAGO";
      name?: string;
      currency: "USD" | "BS";
      price?: number;
      utilityPercent?: number;
      paymentMethodId?: string;
      costBasis?: number;
      continueBelowCost?: boolean;
      belowCostReason?: string;
      active?: boolean;
    },
  ) {
    requireAdPermission(ctx, "pricing.manage");
    const prisma = getPrisma();
    const presentation = await prisma.adPresentation.findUniqueOrThrow({
      where: { id: input.presentationId },
      include: { product: true },
    });
    if (presentation.product.tenantId !== ctx.tenantId) {
      throw new ForbiddenError("Presentación fuera del tenant");
    }
    const cost =
      input.costBasis ??
      (input.currency === "USD"
        ? num(presentation.product.avgCostUsd) *
          num(presentation.unitsPerPresentation)
        : num(presentation.product.avgCostBs) *
          num(presentation.unitsPerPresentation));

    let price = input.price;
    let utilityPercent = input.utilityPercent;
    if (price == null && utilityPercent != null) {
      price = priceFromUtility({ cost, utilityPercent }).price;
    }
    if (price == null) throw new ValidationError("Precio o utilidad requeridos");
    const util = utilityFromPrice(cost, price);
    if (util.belowCost) {
      if (!input.continueBelowCost) {
        throw new ValidationError(
          "Precio por debajo del costo. Requiere pricing.override + motivo",
        );
      }
      requireAdPermission(ctx, "pricing.override");
      if (!input.belowCostReason?.trim()) {
        throw new ValidationError("Motivo obligatorio para precio bajo costo");
      }
    }

    const beforePrice =
      input.currency === "USD"
        ? num(presentation.priceUsd)
        : num(presentation.priceBs);

    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.adPresentationPrice.create({
        data: {
          presentationId: presentation.id,
          productId: presentation.productId,
          kind: input.kind,
          name: input.name,
          currency: input.currency,
          price: dec(price!),
          utilityPercent: dec(util.utilityPercent),
          paymentMethodId: input.paymentMethodId,
          active: input.active ?? true,
        },
      });
      if (input.kind === "NORMAL") {
        await tx.adPresentation.update({
          where: { id: presentation.id },
          data:
            input.currency === "USD"
              ? { priceUsd: dec(price!) }
              : { priceBs: dec(price!) },
        });
      }
      return created;
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: util.belowCost ? "price_below_cost" : "update",
      entity: "presentation_price",
      entityId: row.id,
      before: {
        price: beforePrice,
        utility: utilityFromPrice(cost, beforePrice),
      },
      after: {
        price,
        cost,
        utility: util,
        paymentMethodId: input.paymentMethodId,
        reason: input.belowCostReason,
      },
    });

    return {
      ...row,
      price: num(row.price),
      cost,
      utilityAmount: util.utilityAmount,
      utilityPercent: util.utilityPercent,
      marginPercent: util.marginPercent,
      belowCost: util.belowCost,
    };
  },

  async createPromotion(
    ctx: AdRequestContext,
    input: {
      name: string;
      description?: string;
      currency: "USD" | "BS";
      startsAt?: string;
      endsAt?: string;
      active?: boolean;
      paymentMethodIds: string[];
      items: { presentationId: string; qty: number; price: number }[];
    },
  ) {
    requireAdPermission(ctx, "promotions.manage");
    const prisma = getPrisma();
    const items = [];
    for (const it of input.items) {
      const pr = await prisma.adPresentation.findUniqueOrThrow({
        where: { id: it.presentationId },
        include: { product: true },
      });
      if (pr.product.tenantId !== ctx.tenantId) {
        throw new ForbiddenError("Presentación fuera del tenant");
      }
      items.push({
        productId: pr.productId,
        presentationId: pr.id,
        qty: dec(it.qty),
        price: dec(it.price),
      });
    }
    const promo = await prisma.adPromotion.create({
      data: {
        tenantId: ctx.tenantId,
        name: input.name,
        description: input.description,
        currency: input.currency,
        active: input.active ?? true,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        items: { create: items },
        paymentMethods: {
          create: input.paymentMethodIds.map((paymentMethodId) => ({
            paymentMethodId,
          })),
        },
      },
      include: { items: true, paymentMethods: true },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "create",
      entity: "promotion",
      entityId: promo.id,
      after: promo,
    });
    return promo;
  },

  async createCombo(
    ctx: AdRequestContext,
    input: {
      name: string;
      description?: string;
      currency: "USD" | "BS";
      price: number;
      startsAt?: string;
      endsAt?: string;
      active?: boolean;
      paymentMethodIds: string[];
      items: { presentationId: string; qty: number }[];
    },
  ) {
    requireAdPermission(ctx, "promotions.manage");
    const prisma = getPrisma();
    const items = [];
    for (const it of input.items) {
      const pr = await prisma.adPresentation.findUniqueOrThrow({
        where: { id: it.presentationId },
        include: { product: true },
      });
      if (pr.product.tenantId !== ctx.tenantId) {
        throw new ForbiddenError("Presentación fuera del tenant");
      }
      items.push({
        productId: pr.productId,
        presentationId: pr.id,
        qty: dec(it.qty),
      });
    }
    const combo = await prisma.adCombo.create({
      data: {
        tenantId: ctx.tenantId,
        name: input.name,
        description: input.description,
        currency: input.currency,
        price: dec(input.price),
        active: input.active ?? true,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        items: { create: items },
        paymentMethods: {
          create: input.paymentMethodIds.map((paymentMethodId) => ({
            paymentMethodId,
          })),
        },
      },
      include: { items: true, paymentMethods: true },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "create",
      entity: "combo",
      entityId: combo.id,
      after: combo,
    });
    return combo;
  },

  /** Precio aplicable POS según método de pago (promoción > normal). */
  async resolvePosPrice(
    ctx: AdRequestContext,
    input: { presentationId: string; paymentMethodId?: string },
  ) {
    requireAdPermission(ctx, "pos.sell");
    const prisma = getPrisma();
    const presentation = await prisma.adPresentation.findUniqueOrThrow({
      where: { id: input.presentationId },
      include: { product: true },
    });
    if (presentation.product.tenantId !== ctx.tenantId) {
      throw new ForbiddenError("Presentación fuera del tenant");
    }
    const now = new Date();
    if (input.paymentMethodId) {
      const promo = await prisma.adPromotion.findFirst({
        where: {
          tenantId: ctx.tenantId,
          active: true,
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
          paymentMethods: { some: { paymentMethodId: input.paymentMethodId } },
          items: { some: { presentationId: input.presentationId } },
        },
        include: {
          items: {
            where: { presentationId: input.presentationId },
          },
          paymentMethods: true,
        },
      });
      if (promo?.items[0]) {
        const pm = await prisma.adPaymentMethod.findUnique({
          where: { id: input.paymentMethodId },
        });
        if (pm && pm.currency !== promo.currency) {
          throw new ValidationError(
            "Moneda del método de pago incompatible con la promoción",
          );
        }
        return {
          source: "promotion" as const,
          promotionId: promo.id,
          currency: promo.currency,
          price: num(promo.items[0].price),
          paymentMethodId: input.paymentMethodId,
        };
      }
    }
    return {
      source: "normal" as const,
      currency: "USD" as const,
      priceUsd: num(presentation.priceUsd),
      priceBs: num(presentation.priceBs),
    };
  },

  async purchaseAnalysis(
    ctx: AdRequestContext,
    filters: {
      supplierId?: string;
      productId?: string;
      brand?: string;
      warehouseId?: string;
      from?: string;
      to?: string;
    },
  ) {
    requireAdPermission(ctx, "purchase-analysis.view");
    if (filters.warehouseId) {
      requireWarehouseAccess(ctx, filters.warehouseId);
    }
    const prisma = getPrisma();
    const purchases = await prisma.adPurchase.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: { in: ["ORDERED", "RECEIVED"] },
        supplierId: filters.supplierId,
        warehouseId: filters.warehouseId,
        createdAt: {
          gte: filters.from ? new Date(filters.from) : undefined,
          lte: filters.to ? new Date(filters.to) : undefined,
        },
        lines: filters.productId
          ? { some: { productId: filters.productId } }
          : filters.brand
            ? {
                some: {
                  product: {
                    brand: { contains: filters.brand, mode: "insensitive" },
                  },
                },
              }
            : undefined,
      },
      include: {
        supplier: true,
        lines: { include: { product: true, presentation: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    type Agg = {
      productId: string;
      productName: string;
      brand: string | null;
      supplierId: string | null;
      supplierName: string;
      qtyBase: number;
      costSum: number;
      count: number;
      lastAt: Date;
      lastUnitCost: number;
    };
    const map = new Map<string, Agg>();
    for (const p of purchases) {
      for (const l of p.lines) {
        if (filters.productId && l.productId !== filters.productId) continue;
        const key = `${l.productId}::${p.supplierId ?? p.supplierName}`;
        const cur = map.get(key) ?? {
          productId: l.productId,
          productName: l.product.name,
          brand: l.product.brand,
          supplierId: p.supplierId,
          supplierName: p.supplierName,
          qtyBase: 0,
          costSum: 0,
          count: 0,
          lastAt: p.createdAt,
          lastUnitCost: num(l.effectiveUnitCostUsd) || num(l.unitCostUsd),
        };
        cur.qtyBase += num(l.qtyReceivedBase) || num(l.qtyBase);
        cur.costSum +=
          (num(l.effectiveUnitCostUsd) || num(l.unitCostUsd)) *
          (num(l.qtyReceivedBase) || num(l.qtyBase));
        cur.count += 1;
        if (p.createdAt > cur.lastAt) {
          cur.lastAt = p.createdAt;
          cur.lastUnitCost =
            num(l.effectiveUnitCostUsd) || num(l.unitCostUsd);
        }
        map.set(key, cur);
      }
    }

    return [...map.values()].map((a) => ({
      ...a,
      avgUnitCost: a.qtyBase > 0 ? a.costSum / a.qtyBase : 0,
      frequency: a.count,
    }));
  },

  async replenishmentSuggestions(
    ctx: AdRequestContext,
    input: {
      warehouseId?: string;
      coverageDays: number;
      windowDays: number;
    },
  ) {
    requireAdPermission(ctx, "purchase-analysis.view");
    const warehouseId = resolveEffectiveWarehouseId(
      ctx.operator,
      input.warehouseId,
    );
    if (warehouseId) requireWarehouseAccess(ctx, warehouseId);
    const prisma = getPrisma();
    const since = new Date();
    since.setDate(since.getDate() - input.windowDays);

    const products = await prisma.adProduct.findMany({
      where: { tenantId: ctx.tenantId, active: true },
      include: {
        stocks: warehouseId ? { where: { warehouseId } } : true,
        presentations: { where: { active: true }, take: 1 },
      },
    });

    const movements = await prisma.adInventoryMovement.findMany({
      where: {
        type: { in: ["SALE", "SERVE"] },
        createdAt: { gte: since },
        ...(warehouseId ? { warehouseId } : {}),
        product: { tenantId: ctx.tenantId },
      },
    });
    const consumed = new Map<string, number>();
    for (const m of movements) {
      consumed.set(
        m.productId,
        (consumed.get(m.productId) ?? 0) + Math.abs(num(m.qtyBase)),
      );
    }

    const suggestions = products.map((p) => {
      const stock = p.stocks.reduce((a, s) => a + num(s.qtyBase), 0);
      const qtyConsumed = consumed.get(p.id) ?? 0;
      const daily = avgDailyFromWindow(qtyConsumed, input.windowDays);
      const weekly = daily * 7;
      const monthly = daily * 30;
      const sug = suggestReplenishment({
        avgDailyConsumption: daily,
        stockAvailable: stock,
        coverageDays: input.coverageDays,
      });
      return {
        productId: p.id,
        productName: p.name,
        brand: p.brand,
        sku: p.sku,
        presentationId: p.presentations[0]?.id ?? null,
        avgDaily: daily,
        avgWeekly: weekly,
        avgMonthly: monthly,
        stockAvailable: stock,
        stockCommitted: 0,
        estimatedCoverageDays: sug.estimatedCoverageDays,
        suggestedQtyBase: sug.suggested,
        needQtyBase: sug.need,
      };
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      warehouseId: warehouseId ?? undefined,
      action: "replenishment_view",
      entity: "purchase_analysis",
      after: { coverageDays: input.coverageDays, count: suggestions.length },
    });

    return suggestions.filter((s) => s.suggestedQtyBase > 0 || s.avgDaily > 0);
  },

  async createPurchaseOrder(
    ctx: AdRequestContext,
    input: {
      supplierId?: string;
      warehouseId?: string;
      coverageDays?: number;
      expectedAt?: string;
      notes?: string;
      preliminary?: boolean;
      lines: {
        productId: string;
        presentationId?: string;
        suggestedQtyBase: number;
        qtyBase: number;
        notes?: string;
      }[];
    },
  ) {
    requireAdPermission(ctx, "purchase-orders.create");
    if (input.warehouseId) requireWarehouseAccess(ctx, input.warehouseId);
    const prisma = getPrisma();
    const count = await prisma.adPurchaseOrder.count({
      where: { tenantId: ctx.tenantId },
    });
    const year = new Date().getFullYear();
    const documentNumber = `OC-${year}-${String(count + 1).padStart(5, "0")}`;
    const po = await prisma.adPurchaseOrder.create({
      data: {
        tenantId: ctx.tenantId,
        supplierId: input.supplierId,
        warehouseId: input.warehouseId,
        documentNumber,
        status: input.preliminary ? "PRELIMINARY" : "CONFIRMED",
        coverageDays: input.coverageDays,
        expectedAt: input.expectedAt ? new Date(input.expectedAt) : undefined,
        notes: input.notes,
        createdById: ctx.operator.id,
        lines: {
          create: input.lines.map((l) => ({
            productId: l.productId,
            presentationId: l.presentationId,
            suggestedQtyBase: dec(l.suggestedQtyBase),
            qtyBase: dec(l.qtyBase),
            notes: l.notes,
          })),
        },
      },
      include: { lines: true, supplier: true },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      warehouseId: input.warehouseId,
      action: input.preliminary ? "preliminary" : "create",
      entity: "purchase_order",
      entityId: po.id,
      after: po,
    });
    return po;
  },

  async importPreview(
    ctx: AdRequestContext,
    input: {
      fileName?: string;
      rows: {
        code?: string;
        barcode?: string;
        description?: string;
        brand?: string;
        presentation?: string;
        unitsPerPresentation?: number;
        qty?: number;
        unitCost?: number;
        presentationCost?: number;
        lineTotal?: number;
        currency?: "USD" | "BS";
        action?: "create" | "update" | "skip";
      }[];
    },
  ) {
    requireAdPermission(ctx, "products.manage");
    const prisma = getPrisma();
    const batch = await prisma.adImportBatch.create({
      data: {
        tenantId: ctx.tenantId,
        kind: "products",
        fileName: input.fileName,
        status: "PREVIEW",
        createdById: ctx.operator.id,
      },
    });

    const seenCodes = new Set<string>();
    const rowCreates = [];
    let validCount = 0;
    let errorCount = 0;

    for (let i = 0; i < input.rows.length; i++) {
      const raw = input.rows[i];
      const errors: string[] = [];
      const code = raw.code?.trim();
      const barcode = raw.barcode?.trim();
      if (!raw.description?.trim() && !code) {
        errors.push("Descripción o código requerido");
      }
      if (code) {
        if (seenCodes.has(code.toLowerCase())) {
          errors.push("Código duplicado en archivo");
        }
        seenCodes.add(code.toLowerCase());
      }
      if (
        raw.unitsPerPresentation != null &&
        !(raw.unitsPerPresentation > 0)
      ) {
        errors.push("Unidades por presentación inválidas");
      }
      if (raw.qty != null && raw.qty < 0) errors.push("Cantidad inválida");
      if (raw.unitCost != null && raw.unitCost < 0) {
        errors.push("Costo unitario inválido");
      }
      if (raw.currency && !["USD", "BS"].includes(raw.currency)) {
        errors.push("Moneda inválida");
      }

      let existing = null;
      if (code || barcode) {
        existing = await prisma.adProduct.findFirst({
          where: {
            tenantId: ctx.tenantId,
            OR: [
              code ? { sku: { equals: code, mode: "insensitive" } } : undefined,
              barcode
                ? { barcode: { equals: barcode, mode: "insensitive" } }
                : undefined,
            ].filter(Boolean) as Prisma.AdProductWhereInput[],
          },
        });
      }

      const action =
        raw.action ?? (existing ? "update" : "create");
      const valid = errors.length === 0;
      if (valid) validCount += 1;
      else errorCount += 1;

      rowCreates.push({
        batchId: batch.id,
        rowNumber: i + 1,
        raw: raw as Prisma.InputJsonValue,
        normalized: {
          code,
          barcode,
          description: raw.description,
          brand: raw.brand,
          presentation: raw.presentation ?? "Unidad",
          unitsPerPresentation: raw.unitsPerPresentation ?? 1,
          qty: raw.qty ?? 0,
          unitCost: raw.unitCost,
          presentationCost: raw.presentationCost,
          lineTotal: raw.lineTotal,
          currency: raw.currency ?? "USD",
          existingProductId: existing?.id ?? null,
        } as Prisma.InputJsonValue,
        errors: errors as unknown as Prisma.InputJsonValue,
        action,
        productId: existing?.id,
        valid,
      });
    }

    await prisma.adImportRow.createMany({ data: rowCreates });
    const summary = {
      total: input.rows.length,
      valid: validCount,
      errors: errorCount,
    };
    await prisma.adImportBatch.update({
      where: { id: batch.id },
      data: { summary, status: "PREVIEW" },
    });

    const rows = await prisma.adImportRow.findMany({
      where: { batchId: batch.id },
      orderBy: { rowNumber: "asc" },
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "import_preview",
      entity: "import_batch",
      entityId: batch.id,
      after: summary,
    });

    return { batchId: batch.id, status: "PREVIEW", summary, rows };
  },

  async importConfirm(ctx: AdRequestContext, batchId: string) {
    requireAdPermission(ctx, "products.manage");
    const prisma = getPrisma();
    const batch = await prisma.adImportBatch.findFirst({
      where: { id: batchId, tenantId: ctx.tenantId },
      include: { rows: true },
    });
    if (!batch) throw new NotFoundError("Lote de importación no encontrado");
    if (batch.status === "CONFIRMED") {
      throw new ValidationError("Importación ya confirmada");
    }

    let created = 0;
    let updated = 0;
    await prisma.$transaction(async (tx) => {
      for (const row of batch.rows) {
        if (!row.valid || row.action === "skip") continue;
        const n = row.normalized as Record<string, unknown> | null;
        if (!n) continue;
        const name = String(n.description ?? n.code ?? "Producto");
        const sku = (n.code as string | null) ?? undefined;
        const barcode = (n.barcode as string | null) ?? undefined;
        const brand = (n.brand as string | null) ?? undefined;
        const upp = Number(n.unitsPerPresentation ?? 1);
        const unitCost = Number(n.unitCost ?? 0);

        if (row.action === "update" && row.productId) {
          await tx.adProduct.update({
            where: { id: row.productId },
            data: { name, brand, sku, barcode },
          });
          updated += 1;
        } else {
          const product = await tx.adProduct.create({
            data: {
              tenantId: ctx.tenantId,
              name,
              brand,
              sku,
              barcode,
              avgCostUsd: dec(unitCost),
              presentations: {
                create: {
                  name: String(n.presentation ?? "Unidad"),
                  code: "U",
                  unitsPerPresentation: dec(upp),
                  priceUsd: dec(0),
                  priceBs: dec(0),
                  sku,
                  barcode,
                },
              },
            },
          });
          created += 1;
          await tx.adImportRow.update({
            where: { id: row.id },
            data: { productId: product.id },
          });
        }
      }
      await tx.adImportBatch.update({
        where: { id: batchId },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
          summary: { ...(batch.summary as object), created, updated },
        },
      });
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "import_confirm",
      entity: "import_batch",
      entityId: batchId,
      after: { created, updated },
    });

    return { batchId, created, updated, status: "CONFIRMED" };
  },
};
