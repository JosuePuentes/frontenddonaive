/**
 * Servicio Prisma — núcleo operativo A&D Fase 2.
 * Transacciones + aislamiento por depósito + auditoría.
 */
import { createHash, randomBytes } from "node:crypto";
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
  computeOperationalAvailability,
  normalizePhone,
  todayPeriodBounds,
  weightedAverageCost,
} from "./availability.js";
import { writeAdAudit } from "./service.js";

function dec(n: number) {
  return new Prisma.Decimal(n);
}
function num(v: Prisma.Decimal | number) {
  return typeof v === "number" ? v : Number(v);
}

function opaqueQrToken(): string {
  return `ad_qr_${randomBytes(18).toString("hex")}`;
}

export const adOpsService = {
  async createAccount(
    ctx: AdRequestContext,
    input: {
      tableId?: string;
      mesoneraId?: string;
      customerId?: string;
      customerName?: string;
      customerPhone?: string;
      warehouseId?: string;
    },
  ) {
    requireAdPermission(ctx, "accounts.open");
    const warehouseId = resolveEffectiveWarehouseId(
      ctx.operator,
      input.warehouseId,
    );
    if (!warehouseId) throw new ValidationError("Depósito requerido");
    requireWarehouseAccess(ctx, warehouseId);

    const prisma = getPrisma();
    const last = await prisma.adAccount.findFirst({
      where: { tenantId: ctx.tenantId },
      orderBy: { accountNumber: "desc" },
      select: { accountNumber: true },
    });
    const accountNumber = (last?.accountNumber ?? 0) + 1;

    const account = await prisma.adAccount.create({
      data: {
        tenantId: ctx.tenantId,
        warehouseId,
        tableId: input.tableId,
        mesoneraId:
          input.mesoneraId ??
          (ctx.operator.role === "mesonera" ? ctx.operator.id : undefined),
        openedById: ctx.operator.id,
        customerId: input.customerId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        accountNumber,
        status: "ABIERTA",
      },
      include: { lines: true, payments: true },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "create",
      entity: "account",
      entityId: account.id,
      after: { accountNumber, warehouseId },
    });
    return account;
  },

  async addAccountItem(
    ctx: AdRequestContext,
    accountId: string,
    input: { presentationId: string; qty: number },
  ) {
    requireAdPermission(ctx, "accounts.open");
    const prisma = getPrisma();
    const account = await prisma.adAccount.findFirst({
      where: { id: accountId, tenantId: ctx.tenantId },
    });
    if (!account) throw new NotFoundError("Cuenta no encontrada");
    if (account.status === "CERRADA" || account.status === "ANULADA") {
      throw new ValidationError("Cuenta cerrada/anulada");
    }
    requireWarehouseAccess(ctx, account.warehouseId);
    if (
      ctx.operator.role === "mesonera" &&
      account.mesoneraId &&
      account.mesoneraId !== ctx.operator.id
    ) {
      throw new ForbiddenError("Cuenta de otra mesonera");
    }
    const presentation = await prisma.adPresentation.findFirst({
      where: { id: input.presentationId, active: true },
      include: { product: true },
    });
    if (!presentation || presentation.product.tenantId !== ctx.tenantId) {
      throw new ValidationError("Presentación inválida");
    }
    if (!(input.qty > 0)) throw new ValidationError("Cantidad inválida");

    const line = await prisma.adAccountLine.create({
      data: {
        accountId,
        productId: presentation.productId,
        presentationId: presentation.id,
        qtyOrdered: dec(input.qty),
        qtyServed: dec(0),
        unitPriceUsd: presentation.priceUsd,
        unitPriceBs: presentation.priceBs,
      },
    });
    // PEDIR: sin movimiento de stock
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "add_item",
      entity: "account",
      entityId: accountId,
      after: line,
    });
    return line;
  },

  async serveAccountItem(
    ctx: AdRequestContext,
    accountId: string,
    input: { itemId: string; qty: number },
  ) {
    requireAdPermission(ctx, "accounts.serve");
    const prisma = getPrisma();

    return prisma.$transaction(async (tx) => {
      const account = await tx.adAccount.findFirst({
        where: { id: accountId, tenantId: ctx.tenantId },
      });
      if (!account) throw new NotFoundError("Cuenta no encontrada");
      if (account.status === "CERRADA" || account.status === "ANULADA") {
        throw new ValidationError("Cuenta cerrada");
      }
      requireWarehouseAccess(ctx, account.warehouseId);

      const line = await tx.adAccountLine.findFirst({
        where: { id: input.itemId, accountId },
      });
      if (!line) throw new NotFoundError("Ítem no encontrado");
      const pending = num(line.qtyOrdered) - num(line.qtyServed);
      if (!(input.qty > 0) || input.qty > pending) {
        throw new ValidationError(`Solo hay ${pending} pendientes de servir`);
      }

      const presentation = await tx.adPresentation.findUniqueOrThrow({
        where: { id: line.presentationId },
      });
      const qtyBase = input.qty * num(presentation.unitsPerPresentation);

      const updated = await tx.adStock.updateMany({
        where: {
          warehouseId: account.warehouseId,
          productId: line.productId,
          qtyBase: { gte: dec(qtyBase) },
        },
        data: { qtyBase: { decrement: dec(qtyBase) } },
      });
      if (updated.count !== 1) {
        throw new ValidationError("Stock físico insuficiente para servir");
      }

      const served = await tx.adAccountLine.updateMany({
        where: {
          id: line.id,
          qtyServed: { lte: dec(num(line.qtyOrdered) - input.qty) },
        },
        data: { qtyServed: { increment: dec(input.qty) } },
      });
      if (served.count !== 1) {
        throw new ValidationError("Conflicto concurrente al servir; reintente");
      }

      await tx.adInventoryMovement.create({
        data: {
          warehouseId: account.warehouseId,
          productId: line.productId,
          type: "SERVE",
          qtyBase: dec(-qtyBase),
          presentationId: line.presentationId,
          qtyPresentation: dec(input.qty),
          operatorId: ctx.operator.id,
          reference: accountId,
          reason: `Servir cuenta #${account.accountNumber}`,
        },
      });

      await tx.adServiceLog.create({
        data: {
          accountId,
          productId: line.productId,
          presentationId: line.presentationId,
          qtyServed: dec(input.qty),
          qtyBase: dec(qtyBase),
          operatorId: ctx.operator.id,
          warehouseId: account.warehouseId,
        },
      });

      const refreshed = await tx.adAccountLine.findUniqueOrThrow({
        where: { id: line.id },
      });

      await writeAdAudit({
        tenantId: ctx.tenantId,
        operatorId: ctx.operator.id,
        action: "serve",
        entity: "account",
        entityId: accountId,
        before: { qtyServed: num(line.qtyServed) },
        after: {
          qtyServed: num(refreshed.qtyServed),
          pending: num(refreshed.qtyOrdered) - num(refreshed.qtyServed),
        },
      });

      return {
        line: refreshed,
        requested: num(refreshed.qtyOrdered),
        served: num(refreshed.qtyServed),
        pending: num(refreshed.qtyOrdered) - num(refreshed.qtyServed),
      };
    });
  },

  async closeAccount(
    ctx: AdRequestContext,
    accountId: string,
    input: { settlePendingAs?: "commitment" | "prepaid"; notes?: string },
  ) {
    requireAdPermission(ctx, "pos.close_account");
    const prisma = getPrisma();
    const settle = input.settlePendingAs ?? "commitment";

    return prisma.$transaction(async (tx) => {
      const account = await tx.adAccount.findFirst({
        where: { id: accountId, tenantId: ctx.tenantId },
        include: { lines: true },
      });
      if (!account) throw new NotFoundError("Cuenta no encontrada");
      requireWarehouseAccess(ctx, account.warehouseId);

      const pending = account.lines
        .map((l) => ({
          line: l,
          remaining: Math.max(0, num(l.qtyOrdered) - num(l.qtyServed)),
        }))
        .filter((x) => x.remaining > 0);

      let prepaidId: string | undefined;

      if (settle === "prepaid" && pending.length) {
        if (!account.customerId || !account.customerPhone) {
          throw new ValidationError(
            "Cliente y teléfono requeridos para convertir a prepago",
          );
        }
        const customer = await tx.adCustomer.findUniqueOrThrow({
          where: { id: account.customerId },
        });
        const count = await tx.adPrepaid.count({
          where: { tenantId: ctx.tenantId },
        });
        const code = `PRE-2026-${String(count + 1).padStart(6, "0")}`;
        const token = opaqueQrToken();
        let totalBase = 0;
        const itemData = [];
        for (const p of pending) {
          const pres = await tx.adPresentation.findUniqueOrThrow({
            where: { id: p.line.presentationId },
          });
          const basePer = num(pres.unitsPerPresentation);
          totalBase += p.remaining * basePer;
          itemData.push({
            productId: p.line.productId,
            presentationId: p.line.presentationId,
            qtyPurchased: dec(p.remaining),
            unitPriceUsd: p.line.unitPriceUsd,
            unitPriceBs: p.line.unitPriceBs,
            qtyBasePerUnit: dec(basePer),
          });
        }
        const prepaid = await tx.adPrepaid.create({
          data: {
            tenantId: ctx.tenantId,
            customerId: account.customerId,
            warehouseId: account.warehouseId,
            qrToken: token,
            code,
            customerPhone: account.customerPhone,
            customerDocument: customer.document,
            sourceAccountId: account.id,
            totalQtyBase: dec(totalBase),
            remainingBase: dec(totalBase),
            items: { create: itemData },
          },
        });
        prepaidId = prepaid.id;
        // No descuenta stock al crear (consumo sí)
      } else {
        for (const p of pending) {
          const pres = await tx.adPresentation.findUniqueOrThrow({
            where: { id: p.line.presentationId },
          });
          await tx.adCustomerCommitment.create({
            data: {
              tenantId: ctx.tenantId,
              customerId: account.customerId,
              accountId: account.id,
              productId: p.line.productId,
              presentationId: p.line.presentationId,
              qtyRemaining: dec(p.remaining),
              qtyBaseRemaining: dec(
                p.remaining * num(pres.unitsPerPresentation),
              ),
              status: "PENDIENTE",
              blocksSales: false,
            },
          });
        }
      }

      const closed = await tx.adAccount.update({
        where: { id: accountId },
        data: {
          status: "CERRADA",
          closedAt: new Date(),
          closedById: ctx.operator.id,
          notes: input.notes ?? account.notes,
        },
        include: { lines: true, payments: true },
      });

      await writeAdAudit({
        tenantId: ctx.tenantId,
        operatorId: ctx.operator.id,
        action: "close",
        entity: "account",
        entityId: accountId,
        after: { settle, prepaidId, pending: pending.length },
      });

      return { account: closed, prepaidId };
    });
  },

  async voidAccount(
    ctx: AdRequestContext,
    accountId: string,
    input: { reason: string },
  ) {
    requireAdPermission(ctx, "pos.refund");
    if (!input.reason.trim()) throw new ValidationError("Motivo obligatorio");
    const prisma = getPrisma();

    return prisma.$transaction(async (tx) => {
      const account = await tx.adAccount.findFirst({
        where: { id: accountId, tenantId: ctx.tenantId },
        include: { lines: true },
      });
      if (!account) throw new NotFoundError("Cuenta no encontrada");
      if (account.status === "ANULADA") {
        throw new ValidationError("Cuenta ya anulada");
      }
      requireWarehouseAccess(ctx, account.warehouseId);

      for (const line of account.lines) {
        const served = num(line.qtyServed);
        if (served <= 0) continue;
        const presentation = await tx.adPresentation.findUniqueOrThrow({
          where: { id: line.presentationId },
        });
        const qtyBase = served * num(presentation.unitsPerPresentation);
        await tx.adStock.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: account.warehouseId,
              productId: line.productId,
            },
          },
          create: {
            warehouseId: account.warehouseId,
            productId: line.productId,
            qtyBase: dec(qtyBase),
          },
          update: { qtyBase: { increment: dec(qtyBase) } },
        });
        await tx.adInventoryMovement.create({
          data: {
            warehouseId: account.warehouseId,
            productId: line.productId,
            type: "VOID_REVERSAL",
            qtyBase: dec(qtyBase),
            presentationId: line.presentationId,
            qtyPresentation: dec(served),
            operatorId: ctx.operator.id,
            reference: accountId,
            reason: input.reason,
          },
        });
      }

      const voided = await tx.adAccount.update({
        where: { id: accountId },
        data: {
          status: "ANULADA",
          voidedAt: new Date(),
          voidReason: input.reason,
        },
      });
      await writeAdAudit({
        tenantId: ctx.tenantId,
        operatorId: ctx.operator.id,
        action: "void",
        entity: "account",
        entityId: accountId,
        before: { status: account.status },
        after: { status: "ANULADA", reason: input.reason },
      });
      return voided;
    });
  },

  async getAvailability(
    ctx: AdRequestContext,
    productId: string,
    requestedBase = 0,
    preferredWarehouseId?: string,
  ) {
    requireAdPermission(ctx, "inventory.read");
    const prisma = getPrisma();
    const warehouses = await prisma.adWarehouse.findMany({
      where: { tenantId: ctx.tenantId, active: true },
    });
    const preferred =
      resolveEffectiveWarehouseId(ctx.operator, preferredWarehouseId) ??
      warehouses[0]?.id;
    if (!preferred) throw new ValidationError("Sin depósitos");

    const [stocks, accounts, presentations, transfers, commitments] =
      await Promise.all([
        prisma.adStock.findMany({
          where: { warehouse: { tenantId: ctx.tenantId } },
        }),
        prisma.adAccount.findMany({
          where: { tenantId: ctx.tenantId },
          include: { lines: true },
        }),
        prisma.adPresentation.findMany({
          where: { product: { tenantId: ctx.tenantId } },
        }),
        prisma.adStockTransfer.findMany({
          where: { tenantId: ctx.tenantId },
          include: { lines: true },
        }),
        prisma.adCustomerCommitment.findMany({
          where: { tenantId: ctx.tenantId, status: "PENDIENTE" },
        }),
      ]);

    return computeOperationalAvailability({
      productId,
      stocks: stocks.map((s) => ({
        warehouseId: s.warehouseId,
        productId: s.productId,
        qtyBase: num(s.qtyBase),
      })),
      accounts: accounts.map((a) => ({
        status: a.status,
        warehouseId: a.warehouseId,
        lines: a.lines.map((l) => ({
          productId: l.productId,
          presentationId: l.presentationId,
          qtyOrdered: num(l.qtyOrdered),
          qtyServed: num(l.qtyServed),
        })),
      })),
      presentations: presentations.map((p) => ({
        id: p.id,
        unitsPerPresentation: num(p.unitsPerPresentation),
      })),
      transfers: transfers.map((t) => ({
        status: t.status,
        fromWarehouseId: t.fromWarehouseId,
        lines: t.lines.map((l) => ({
          productId: l.productId,
          presentationId: l.presentationId ?? "",
          qty: num(l.qty),
          qtyBase: num(l.qtyBase),
        })),
      })),
      commitments: commitments.map((c) => ({
        productId: c.productId,
        status: c.status,
        qtyBaseRemaining: num(c.qtyBaseRemaining),
      })),
      warehouseIds: warehouses.map((w) => w.id),
      preferredWarehouseId: preferred,
      requestedBase,
    });
  },

  async createPurchase(
    ctx: AdRequestContext,
    input: {
      supplierName: string;
      invoiceNumber: string;
      warehouseId: string;
      reference?: string;
      notes?: string;
      lines: {
        presentationId: string;
        qty: number;
        unitCostUsd: number;
        unitCostBs: number;
      }[];
    },
  ) {
    requireAdPermission(ctx, "purchase.create");
    const warehouseId = resolveEffectiveWarehouseId(
      ctx.operator,
      input.warehouseId,
    );
    if (!warehouseId) throw new ValidationError("Depósito destino obligatorio");
    const prisma = getPrisma();
    const lines = [];
    let totalUsd = 0;
    let totalBs = 0;
    for (const raw of input.lines) {
      const pres = await prisma.adPresentation.findUniqueOrThrow({
        where: { id: raw.presentationId },
        include: { product: true },
      });
      if (pres.product.tenantId !== ctx.tenantId) {
        throw new ForbiddenError("Presentación fuera del tenant");
      }
      const qtyBase = raw.qty * num(pres.unitsPerPresentation);
      const lineCostUsd = raw.unitCostUsd * raw.qty;
      const lineCostBs = raw.unitCostBs * raw.qty;
      totalUsd += lineCostUsd;
      totalBs += lineCostBs;
      lines.push({
        productId: pres.productId,
        presentationId: pres.id,
        qty: dec(raw.qty),
        qtyBase: dec(qtyBase),
        unitCostUsd: dec(raw.unitCostUsd),
        unitCostBs: dec(raw.unitCostBs),
        lineCostUsd: dec(lineCostUsd),
        lineCostBs: dec(lineCostBs),
      });
    }
    const purchase = await prisma.adPurchase.create({
      data: {
        tenantId: ctx.tenantId,
        warehouseId,
        supplierName: input.supplierName,
        invoiceNumber: input.invoiceNumber,
        status: "ORDERED",
        reference: input.reference,
        notes: input.notes,
        totalCostUsd: dec(totalUsd),
        totalCostBs: dec(totalBs),
        createdById: ctx.operator.id,
        lines: { create: lines },
      },
      include: { lines: true },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "create",
      entity: "purchase",
      entityId: purchase.id,
      after: purchase,
    });
    return purchase;
  },

  async receivePurchase(ctx: AdRequestContext, purchaseId: string) {
    requireAdPermission(ctx, "inventory.receive");
    const prisma = getPrisma();
    return prisma.$transaction(async (tx) => {
      const purchase = await tx.adPurchase.findFirst({
        where: { id: purchaseId, tenantId: ctx.tenantId },
        include: { lines: true },
      });
      if (!purchase) throw new NotFoundError("Compra no encontrada");
      if (purchase.status === "RECEIVED") {
        throw new ValidationError("Compra ya recibida (no duplicar)");
      }
      if (purchase.status === "CANCELLED") {
        throw new ValidationError("Compra cancelada");
      }

      for (const line of purchase.lines) {
        const stock = await tx.adStock.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: purchase.warehouseId,
              productId: line.productId,
            },
          },
        });
        const prevQty = stock ? num(stock.qtyBase) : 0;
        const product = await tx.adProduct.findUniqueOrThrow({
          where: { id: line.productId },
        });
        /** F5: CPP usa cantidad recibida (facturada+bonificada) y costo efectivo. */
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
              warehouseId: purchase.warehouseId,
              productId: line.productId,
            },
          },
          create: {
            warehouseId: purchase.warehouseId,
            productId: line.productId,
            qtyBase: dec(qtyIn),
          },
          update: { qtyBase: { increment: dec(qtyIn) } },
        });
        await tx.adInventoryMovement.create({
          data: {
            warehouseId: purchase.warehouseId,
            productId: line.productId,
            type: "PURCHASE",
            qtyBase: dec(qtyIn),
            presentationId: line.presentationId,
            qtyPresentation: line.qty,
            operatorId: ctx.operator.id,
            reference: purchase.id,
            reason: `Recepción ${purchase.invoiceNumber}`,
          },
        });
      }

      const received = await tx.adPurchase.updateMany({
        where: { id: purchaseId, status: { not: "RECEIVED" } },
        data: {
          status: "RECEIVED",
          receivedAt: new Date(),
          receivedById: ctx.operator.id,
        },
      });
      if (received.count !== 1) {
        throw new ValidationError("Doble recepción concurrente evitada");
      }
      await writeAdAudit({
        tenantId: ctx.tenantId,
        operatorId: ctx.operator.id,
        action: "receive",
        entity: "purchase",
        entityId: purchaseId,
      });
      return tx.adPurchase.findUniqueOrThrow({
        where: { id: purchaseId },
        include: { lines: true },
      });
    });
  },

  async createTransfer(
    ctx: AdRequestContext,
    input: {
      fromWarehouseId: string;
      toWarehouseId: string;
      reason?: string;
      lines: { presentationId: string; qty: number }[];
    },
  ) {
    requireAdPermission(ctx, "inventory.transfer");
    if (input.fromWarehouseId === input.toWarehouseId) {
      throw new ValidationError("Origen y destino deben ser distintos");
    }
    const prisma = getPrisma();
    const count = await prisma.adStockTransfer.count({
      where: { tenantId: ctx.tenantId },
    });
    const documentNumber = `TR-DRAFT-${count + 1}`;
    const lines = [];
    for (const raw of input.lines) {
      const pres = await prisma.adPresentation.findUniqueOrThrow({
        where: { id: raw.presentationId },
      });
      lines.push({
        productId: pres.productId,
        presentationId: pres.id,
        qty: dec(raw.qty),
        qtyBase: dec(raw.qty * num(pres.unitsPerPresentation)),
      });
    }
    const transfer = await prisma.adStockTransfer.create({
      data: {
        tenantId: ctx.tenantId,
        documentNumber,
        fromWarehouseId: input.fromWarehouseId,
        toWarehouseId: input.toWarehouseId,
        status: "DRAFT",
        createdById: ctx.operator.id,
        reason: input.reason,
        lines: { create: lines },
      },
      include: { lines: true },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "create",
      entity: "transfer",
      entityId: transfer.id,
    });
    return transfer;
  },

  async confirmTransferAtomic(ctx: AdRequestContext, transferId: string) {
    requireAdPermission(ctx, "inventory.transfer");
    const prisma = getPrisma();
    return prisma.$transaction(async (tx) => {
      const tr = await tx.adStockTransfer.findFirst({
        where: { id: transferId, tenantId: ctx.tenantId },
        include: { lines: true },
      });
      if (!tr) throw new NotFoundError("Transferencia no encontrada");
      if (tr.stockMoved || tr.status === "RECEIVED") {
        throw new ValidationError("Transferencia ya confirmada (no duplicar)");
      }
      for (const line of tr.lines) {
        const updated = await tx.adStock.updateMany({
          where: {
            warehouseId: tr.fromWarehouseId,
            productId: line.productId,
            qtyBase: { gte: line.qtyBase },
          },
          data: { qtyBase: { decrement: line.qtyBase } },
        });
        if (updated.count !== 1) {
          throw new ValidationError("Stock insuficiente en origen");
        }
        await tx.adStock.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: tr.toWarehouseId,
              productId: line.productId,
            },
          },
          create: {
            warehouseId: tr.toWarehouseId,
            productId: line.productId,
            qtyBase: line.qtyBase,
          },
          update: { qtyBase: { increment: line.qtyBase } },
        });
        await tx.adInventoryMovement.create({
          data: {
            warehouseId: tr.fromWarehouseId,
            productId: line.productId,
            type: "TRANSFER_OUT",
            qtyBase: dec(-num(line.qtyBase)),
            presentationId: line.presentationId,
            operatorId: ctx.operator.id,
            reference: tr.id,
          },
        });
        await tx.adInventoryMovement.create({
          data: {
            warehouseId: tr.toWarehouseId,
            productId: line.productId,
            type: "TRANSFER_IN",
            qtyBase: line.qtyBase,
            presentationId: line.presentationId,
            operatorId: ctx.operator.id,
            reference: tr.id,
          },
        });
      }
      const count = await tx.adStockTransfer.count({
        where: { tenantId: ctx.tenantId, stockMoved: true },
      });
      const year = new Date().getFullYear();
      const updated = await tx.adStockTransfer.updateMany({
        where: { id: transferId, stockMoved: false },
        data: {
          stockMoved: true,
          status: "RECEIVED",
          documentNumber: `TR-${year}-${String(count + 1).padStart(6, "0")}`,
          receivedById: ctx.operator.id,
          receivedAt: new Date(),
          confirmedAt: new Date(),
        },
      });
      if (updated.count !== 1) {
        throw new ValidationError("Doble transferencia concurrente evitada");
      }
      await writeAdAudit({
        tenantId: ctx.tenantId,
        operatorId: ctx.operator.id,
        action: "confirm",
        entity: "transfer",
        entityId: transferId,
        before: { status: tr.status },
        after: { status: "RECEIVED" },
      });
      return tx.adStockTransfer.findUniqueOrThrow({
        where: { id: transferId },
        include: { lines: true },
      });
    });
  },

  async createPrepaid(
    ctx: AdRequestContext,
    input: {
      customerId: string;
      warehouseId?: string;
      items: { presentationId: string; qty: number }[];
      sourceAccountId?: string;
    },
  ) {
    const warehouseId = resolveEffectiveWarehouseId(
      ctx.operator,
      input.warehouseId,
    );
    if (!warehouseId) throw new ValidationError("Depósito requerido");
    const prisma = getPrisma();
    const customer = await prisma.adCustomer.findFirst({
      where: { id: input.customerId, tenantId: ctx.tenantId },
    });
    if (!customer) throw new NotFoundError("Cliente no encontrado");
    if (!customer.document?.trim()) {
      throw new ValidationError("Cédula obligatoria para QR");
    }
    const count = await prisma.adPrepaid.count({
      where: { tenantId: ctx.tenantId },
    });
    const code = `PRE-2026-${String(count + 1).padStart(6, "0")}`;
    let totalBase = 0;
    const items = [];
    for (const raw of input.items) {
      const pres = await prisma.adPresentation.findUniqueOrThrow({
        where: { id: raw.presentationId },
      });
      const basePer = num(pres.unitsPerPresentation);
      totalBase += raw.qty * basePer;
      items.push({
        productId: pres.productId,
        presentationId: pres.id,
        qtyPurchased: dec(raw.qty),
        unitPriceUsd: pres.priceUsd,
        unitPriceBs: pres.priceBs,
        qtyBasePerUnit: dec(basePer),
      });
    }
    const prepaid = await prisma.adPrepaid.create({
      data: {
        tenantId: ctx.tenantId,
        customerId: customer.id,
        warehouseId,
        qrToken: opaqueQrToken(),
        code,
        customerPhone: customer.phone,
        customerDocument: customer.document,
        sourceAccountId: input.sourceAccountId,
        totalQtyBase: dec(totalBase),
        remainingBase: dec(totalBase),
        items: { create: items },
      },
      include: { items: true },
    });
    // No descuenta stock al crear
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "create",
      entity: "prepaid",
      entityId: prepaid.id,
      after: { code, stockDeductedOnCreate: false },
    });
    return prepaid;
  },

  async consumePrepaid(
    ctx: AdRequestContext,
    prepaidId: string,
    input: {
      presentationId: string;
      qty: number;
      verifyPhone: string;
      verifyDocument: string;
    },
  ) {
    const prisma = getPrisma();
    return prisma.$transaction(async (tx) => {
      const prepaid = await tx.adPrepaid.findFirst({
        where: { id: prepaidId, tenantId: ctx.tenantId },
        include: { items: true },
      });
      if (!prepaid || prepaid.status === "VOIDED" || prepaid.status === "DEPLETED") {
        throw new ValidationError("Prepago no consumible");
      }
      if (
        normalizePhone(input.verifyPhone) !==
        normalizePhone(prepaid.customerPhone)
      ) {
        throw new ForbiddenError("Teléfono no coincide con el titular");
      }
      if (
        !prepaid.customerDocument ||
        input.verifyDocument.trim().toLowerCase() !==
          prepaid.customerDocument.trim().toLowerCase()
      ) {
        throw new ForbiddenError("Cédula no coincide con el titular");
      }
      const item = prepaid.items.find(
        (i) => i.presentationId === input.presentationId,
      );
      if (!item) throw new ValidationError("Producto no está en el prepago");
      const available = num(item.qtyPurchased) - num(item.qtyConsumed);
      if (!(input.qty > 0) || input.qty > available) {
        throw new ValidationError(`Disponibles: ${available}`);
      }
      const qtyBase = input.qty * num(item.qtyBasePerUnit);
      const warehouseId = prepaid.warehouseId;
      if (!warehouseId) throw new ValidationError("Prepago sin depósito");

      const stockOk = await tx.adStock.updateMany({
        where: {
          warehouseId,
          productId: item.productId,
          qtyBase: { gte: dec(qtyBase) },
        },
        data: { qtyBase: { decrement: dec(qtyBase) } },
      });
      if (stockOk.count !== 1) {
        throw new ValidationError("Stock físico insuficiente para consumo");
      }

      const itemOk = await tx.adPrepaidItem.updateMany({
        where: {
          id: item.id,
          qtyConsumed: { lte: dec(num(item.qtyPurchased) - input.qty) },
        },
        data: { qtyConsumed: { increment: dec(input.qty) } },
      });
      if (itemOk.count !== 1) {
        throw new ValidationError("Conflicto de concurrencia en ítem prepago");
      }

      const versionOk = await tx.adPrepaid.updateMany({
        where: { id: prepaid.id, version: prepaid.version },
        data: {
          version: { increment: 1 },
          remainingBase: { decrement: dec(qtyBase) },
        },
      });
      if (versionOk.count !== 1) {
        throw new ValidationError("Doble consumo concurrente evitado");
      }

      await tx.adInventoryMovement.create({
        data: {
          warehouseId,
          productId: item.productId,
          type: "PREPAID_CONSUME",
          qtyBase: dec(-qtyBase),
          presentationId: item.presentationId,
          qtyPresentation: dec(input.qty),
          operatorId: ctx.operator.id,
          reference: prepaid.id,
        },
      });
      await tx.adPrepaidConsumption.create({
        data: {
          prepaidId: prepaid.id,
          productId: item.productId,
          presentationId: item.presentationId,
          qty: dec(input.qty),
          qtyBase: dec(qtyBase),
          operatorId: ctx.operator.id,
          verifiedPhone: input.verifyPhone,
          verifiedDocument: input.verifyDocument,
        },
      });

      const refreshedItems = await tx.adPrepaidItem.findMany({
        where: { prepaidId: prepaid.id },
      });
      const depleted = refreshedItems.every(
        (i) => num(i.qtyPurchased) - num(i.qtyConsumed) <= 0,
      );
      await tx.adPrepaid.update({
        where: { id: prepaid.id },
        data: { status: depleted ? "DEPLETED" : "PARTIAL" },
      });

      await writeAdAudit({
        tenantId: ctx.tenantId,
        operatorId: ctx.operator.id,
        action: "consume",
        entity: "prepaid",
        entityId: prepaid.id,
        before: { available },
        after: { consumed: input.qty, remaining: available - input.qty },
      });

      return { remaining: available - input.qty, depleted };
    });
  },

  async findPrepaidByQr(ctx: AdRequestContext, token: string) {
    const prisma = getPrisma();
    const prepaid = await prisma.adPrepaid.findFirst({
      where: {
        tenantId: ctx.tenantId,
        OR: [{ qrToken: token }, { code: token }],
      },
      include: { items: true, customer: true },
    });
    if (!prepaid) throw new NotFoundError("QR/prepago no encontrado");
    // Nunca devolver ids internos como "token"; el token opaco ya está.
    return {
      id: prepaid.id,
      code: prepaid.code,
      qrToken: prepaid.qrToken,
      status: prepaid.status,
      customerName: prepaid.customer.name,
      // No exponer documento completo en listados públicos futuros — F2 context auth OK
      items: prepaid.items.map((i) => ({
        presentationId: i.presentationId,
        productId: i.productId,
        qtyPurchased: num(i.qtyPurchased),
        qtyConsumed: num(i.qtyConsumed),
        remaining: num(i.qtyPurchased) - num(i.qtyConsumed),
      })),
    };
  },

  async createCashClosure(
    ctx: AdRequestContext,
    input: {
      warehouseId?: string;
      countedCashUsd: number;
      countedCashBs: number;
      notes?: string;
    },
  ) {
    requireAdPermission(ctx, "closures.create");
    const warehouseId = resolveEffectiveWarehouseId(
      ctx.operator,
      input.warehouseId,
    );
    if (!warehouseId) throw new ValidationError("Depósito requerido");
    requireWarehouseAccess(ctx, warehouseId);

    const prisma = getPrisma();
    const tenant = await prisma.adTenant.findUniqueOrThrow({
      where: { id: ctx.tenantId },
    });
    const { periodStart, periodEnd, dateKey } = todayPeriodBounds(
      tenant.timezone,
    );

    const sales = await prisma.adSale.findMany({
      where: {
        tenantId: ctx.tenantId,
        warehouseId,
        status: "completed",
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      include: { payments: true },
    });
    let expectedCashUsd = 0;
    let expectedCashBs = 0;
    for (const sale of sales) {
      for (const p of sale.payments) {
        if (p.method === "efectivo_usd" && p.currency === "USD") {
          expectedCashUsd += num(p.amount);
        }
        if (p.method === "efectivo_bs" && p.currency === "BS") {
          expectedCashBs += num(p.amount);
        }
      }
    }

    const closure = await prisma.adCashClosure.create({
      data: {
        tenantId: ctx.tenantId,
        warehouseId,
        operatorId: ctx.operator.id,
        periodStart,
        periodEnd,
        expectedCashUsd: dec(expectedCashUsd),
        expectedCashBs: dec(expectedCashBs),
        countedCashUsd: dec(input.countedCashUsd),
        countedCashBs: dec(input.countedCashBs),
        differenceUsd: dec(input.countedCashUsd - expectedCashUsd),
        differenceBs: dec(input.countedCashBs - expectedCashBs),
        status: "CLOSED",
        snapshot: {
          dateKey,
          salesCount: sales.length,
          timezone: tenant.timezone,
          notes: input.notes ?? null,
        },
      },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "close",
      entity: "cash_closure",
      entityId: closure.id,
      after: closure,
    });
    return closure;
  },

  async createInventoryClosure(
    ctx: AdRequestContext,
    input: {
      warehouseId?: string;
      lines: { productId: string; physicalBase: number }[];
      applyAdjustments?: boolean;
      notes?: string;
    },
  ) {
    requireAdPermission(ctx, "closures.create");
    const warehouseId = resolveEffectiveWarehouseId(
      ctx.operator,
      input.warehouseId,
    );
    if (!warehouseId) throw new ValidationError("Depósito requerido");
    requireWarehouseAccess(ctx, warehouseId);
    const prisma = getPrisma();

    return prisma.$transaction(async (tx) => {
      const lineRows = [];
      for (const raw of input.lines) {
        const stock = await tx.adStock.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId,
              productId: raw.productId,
            },
          },
        });
        const theoretical = stock ? num(stock.qtyBase) : 0;
        const difference = raw.physicalBase - theoretical;
        if (input.applyAdjustments && difference !== 0) {
          await tx.adStock.upsert({
            where: {
              warehouseId_productId: {
                warehouseId,
                productId: raw.productId,
              },
            },
            create: {
              warehouseId,
              productId: raw.productId,
              qtyBase: dec(raw.physicalBase),
            },
            update: { qtyBase: dec(raw.physicalBase) },
          });
          await tx.adInventoryMovement.create({
            data: {
              warehouseId,
              productId: raw.productId,
              type: difference > 0 ? "ADJUST_IN" : "ADJUST_OUT",
              qtyBase: dec(difference),
              operatorId: ctx.operator.id,
              reason: "Cierre inventario",
            },
          });
        }
        lineRows.push({
          productId: raw.productId,
          theoreticalBase: dec(theoretical),
          physicalBase: dec(raw.physicalBase),
          differenceBase: dec(difference),
        });
      }
      const closure = await tx.adInventoryClosure.create({
        data: {
          tenantId: ctx.tenantId,
          warehouseId,
          operatorId: ctx.operator.id,
          status: "CLOSED",
          notes: input.notes,
          lines: { create: lineRows },
        },
        include: { lines: true },
      });
      await writeAdAudit({
        tenantId: ctx.tenantId,
        operatorId: ctx.operator.id,
        action: "close",
        entity: "inventory_closure",
        entityId: closure.id,
      });
      return closure;
    });
  },

  async createPurchaseRequest(
    ctx: AdRequestContext,
    input: {
      productId: string;
      qtyBaseNeeded: number;
      warehouseId?: string;
      reason?: string;
    },
  ) {
    requireAdPermission(ctx, "cop.purchase_request");
    const prisma = getPrisma();
    const req = await prisma.adPurchaseRequest.create({
      data: {
        tenantId: ctx.tenantId,
        productId: input.productId,
        qtyBaseNeeded: dec(input.qtyBaseNeeded),
        warehouseId: input.warehouseId,
        reason: input.reason,
        createdById: ctx.operator.id,
        status: "REQUESTED",
      },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "create",
      entity: "purchase_request",
      entityId: req.id,
    });
    return req;
  },

  /** Fingerprint estable de projectId (documentación F1 riesgo cross-schema). */
  projectIdFingerprint(projectId: string): string {
    return createHash("sha256").update(projectId).digest("hex").slice(0, 16);
  },
};
