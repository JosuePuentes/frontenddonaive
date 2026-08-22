/**
 * A&D Fase 7 — Finanzas: cuentas, movimientos, transferencias, casa de cambio.
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
  requireWarehouseAccess,
  type AdRequestContext,
} from "./authorization.js";
import {
  convertBetweenCurrencies,
  movementSignForAccount,
  replacementCostFromRates,
} from "./finance-domain.js";
import { postConfirmedMovement } from "./finance-ledger.js";
import { writeAdAudit } from "./service.js";

function dec(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n);
}

function num(v: Prisma.Decimal | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

function dayBounds(fromDate: string, toDateInclusive: string): {
  from: Date;
  toExclusive: Date;
} {
  const from = new Date(`${fromDate.slice(0, 10)}T00:00:00.000Z`);
  const end = new Date(`${toDateInclusive.slice(0, 10)}T00:00:00.000Z`);
  const toExclusive = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  return { from, toExclusive };
}

function money(m: {
  currency: string;
  balance: Prisma.Decimal | number;
  openingBalance?: Prisma.Decimal | number;
  [k: string]: unknown;
}) {
  return {
    ...m,
    balance: num(m.balance),
    openingBalance: num(m.openingBalance),
  };
}

async function latestRate(
  tenantId: string,
  kind: "BCV" | "PROTECTED",
): Promise<number | null> {
  const row = await getPrisma().adExchangeRate.findFirst({
    where: { tenantId, kind },
    orderBy: { effectiveAt: "desc" },
  });
  return row ? num(row.rate) : null;
}

function sanitizeProtectedFromClient<T extends Record<string, unknown>>(
  data: T,
  canSeeProtected: boolean,
): T {
  if (canSeeProtected) return data;
  const copy = { ...data };
  delete (copy as { protectedRate?: unknown }).protectedRate;
  delete (copy as { protectedRateSnapshot?: unknown }).protectedRateSnapshot;
  delete (copy as { currentProtectedRate?: unknown }).currentProtectedRate;
  return copy;
}

export const adFinanceService = {
  async getSettings(ctx: AdRequestContext) {
    requireAdPermission(ctx, "finance.view");
    const prisma = getPrisma();
    let row = await prisma.adFinanceSettings.findUnique({
      where: { tenantId: ctx.tenantId },
    });
    if (!row) {
      row = await prisma.adFinanceSettings.create({
        data: {
          tenantId: ctx.tenantId,
          parallelRateHotkey: "Control+x",
          pricingCriticalUtilityPercent: dec(5),
          inventoryCriticalCoverageDays: 3,
          inventoryWarnCoverageDays: 7,
        },
      });
    }
    return {
      ...row,
      pricingCriticalUtilityPercent: num(row.pricingCriticalUtilityPercent),
      inventoryCriticalCoverageDays: row.inventoryCriticalCoverageDays,
      inventoryWarnCoverageDays: row.inventoryWarnCoverageDays,
    };
  },

  async updateSettings(
    ctx: AdRequestContext,
    input: {
      parallelRateHotkey?: string;
      pricingCriticalUtilityPercent?: number;
      inventoryCriticalCoverageDays?: number;
      inventoryWarnCoverageDays?: number;
    },
  ) {
    requireAdPermission(ctx, "finance.manage");
    const prisma = getPrisma();
    const before = await this.getSettings(ctx);
    const after = await prisma.adFinanceSettings.upsert({
      where: { tenantId: ctx.tenantId },
      create: {
        tenantId: ctx.tenantId,
        parallelRateHotkey: input.parallelRateHotkey ?? "Control+x",
        pricingCriticalUtilityPercent: dec(
          input.pricingCriticalUtilityPercent ?? 5,
        ),
        inventoryCriticalCoverageDays:
          input.inventoryCriticalCoverageDays ?? 3,
        inventoryWarnCoverageDays: input.inventoryWarnCoverageDays ?? 7,
      },
      update: {
        parallelRateHotkey:
          input.parallelRateHotkey ?? before.parallelRateHotkey,
        pricingCriticalUtilityPercent:
          input.pricingCriticalUtilityPercent !== undefined
            ? dec(input.pricingCriticalUtilityPercent)
            : undefined,
        inventoryCriticalCoverageDays:
          input.inventoryCriticalCoverageDays ?? undefined,
        inventoryWarnCoverageDays:
          input.inventoryWarnCoverageDays ?? undefined,
      },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "update",
      entity: "finance_settings",
      entityId: after.id,
      before,
      after: {
        ...after,
        pricingCriticalUtilityPercent: num(
          after.pricingCriticalUtilityPercent,
        ),
      },
    });
    return {
      ...after,
      pricingCriticalUtilityPercent: num(after.pricingCriticalUtilityPercent),
    };
  },

  async listAccounts(ctx: AdRequestContext) {
    requireAdPermission(ctx, "finance.view");
    const prisma = getPrisma();
    const accounts = await prisma.adFinancialAccount.findMany({
      where: { tenantId: ctx.tenantId },
      include: { paymentMethods: true, warehouse: true },
      orderBy: [{ currency: "asc" }, { name: "asc" }],
    });
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const todayMoves = await prisma.adFinancialMovement.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: "CONFIRMED",
        confirmedAt: { gte: start },
      },
    });

    const byCurrency: Record<
      string,
      { balance: number; income: number; expense: number; transfers: number }
    > = { USD: { balance: 0, income: 0, expense: 0, transfers: 0 }, BS: { balance: 0, income: 0, expense: 0, transfers: 0 } };

    for (const a of accounts) {
      if (!a.active) continue;
      byCurrency[a.currency].balance += num(a.balance);
    }
    for (const m of todayMoves) {
      const cur = m.currency;
      if (m.type === "INGRESO_VENTA") byCurrency[cur].income += num(m.amount);
      if (
        m.type === "EGRESO_COMPRA" ||
        m.type === "EGRESO_GASTO" ||
        m.type === "RETIRO"
      ) {
        byCurrency[cur].expense += num(m.amount);
      }
      if (m.type === "TRANSFERENCIA" || m.type === "CAMBIO_MONEDA") {
        byCurrency[cur].transfers += num(m.amount);
      }
    }

    return {
      summaryByCurrency: byCurrency,
      activeCount: accounts.filter((a) => a.active).length,
      accounts: accounts.map((a) => ({
        ...money(a),
        paymentMethodIds: a.paymentMethods.map((p) => p.id),
        paymentMethods: a.paymentMethods.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          usesSpecialRateRef: p.usesSpecialRateRef,
        })),
      })),
    };
  },

  async createAccount(
    ctx: AdRequestContext,
    input: {
      name: string;
      code?: string;
      type: "BANK" | "CASH" | "TILL" | "DIGITAL" | "OTHER";
      currency: "USD" | "BS";
      openingBalance?: number;
      warehouseId?: string;
      paymentMethodId?: string;
      notes?: string;
      active?: boolean;
    },
  ) {
    requireAdPermission(ctx, "finance.manage");
    const prisma = getPrisma();
    if (input.warehouseId) requireWarehouseAccess(ctx, input.warehouseId);
    const opening = input.openingBalance ?? 0;
    if (opening < 0) throw new ValidationError("Saldo inicial inválido");

    const account = await prisma.$transaction(async (tx) => {
      const created = await tx.adFinancialAccount.create({
        data: {
          tenantId: ctx.tenantId,
          name: input.name.trim(),
          code: input.code,
          type: input.type,
          currency: input.currency,
          openingBalance: dec(opening),
          balance: dec(opening),
          warehouseId: input.warehouseId,
          notes: input.notes,
          active: input.active ?? true,
        },
        include: { paymentMethods: true },
      });
      if (input.paymentMethodId) {
        const pm = await tx.adPaymentMethod.findFirst({
          where: { id: input.paymentMethodId, tenantId: ctx.tenantId },
        });
        if (!pm) throw new NotFoundError("Método de pago no encontrado");
        if (pm.currency !== input.currency) {
          throw new ValidationError(
            "Moneda del método no coincide con la cuenta",
          );
        }
        await tx.adPaymentMethod.update({
          where: { id: pm.id },
          data: { financialAccountId: created.id },
        });
      }
      if (opening > 0) {
        await tx.adFinancialMovement.create({
          data: {
            tenantId: ctx.tenantId,
            type: "AJUSTE",
            status: "CONFIRMED",
            accountId: created.id,
            currency: input.currency,
            amount: dec(opening),
            concept: "Saldo inicial",
            operatorId: ctx.operator.id,
            warehouseId: input.warehouseId,
            balanceBefore: dec(0),
            balanceAfter: dec(opening),
            confirmedAt: new Date(),
          },
        });
      }
      return created;
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      warehouseId: input.warehouseId,
      action: "create",
      entity: "financial_account",
      entityId: account.id,
      after: { name: account.name, currency: account.currency, opening },
    });

    const fresh = await getPrisma().adFinancialAccount.findUniqueOrThrow({
      where: { id: account.id },
      include: { paymentMethods: true },
    });
    return money(fresh);
  },

  async updateAccount(
    ctx: AdRequestContext,
    id: string,
    input: {
      name?: string;
      code?: string;
      type?: "BANK" | "CASH" | "TILL" | "DIGITAL" | "OTHER";
      active?: boolean;
      notes?: string;
      paymentMethodId?: string | null;
      warehouseId?: string | null;
    },
  ) {
    requireAdPermission(ctx, "finance.manage");
    const prisma = getPrisma();
    const before = await prisma.adFinancialAccount.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });
    if (!before) throw new NotFoundError("Cuenta no encontrada");

    const after = await prisma.$transaction(async (tx) => {
      const updated = await tx.adFinancialAccount.update({
        where: { id },
        data: {
          name: input.name?.trim(),
          code: input.code,
          type: input.type,
          active: input.active,
          notes: input.notes,
          warehouseId: input.warehouseId === undefined ? undefined : input.warehouseId,
        },
        include: { paymentMethods: true },
      });
      if (input.paymentMethodId !== undefined) {
        await tx.adPaymentMethod.updateMany({
          where: { financialAccountId: id, tenantId: ctx.tenantId },
          data: { financialAccountId: null },
        });
        if (input.paymentMethodId) {
          await tx.adPaymentMethod.update({
            where: { id: input.paymentMethodId },
            data: { financialAccountId: id },
          });
        }
      }
      return updated;
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "update",
      entity: "financial_account",
      entityId: id,
      before: { name: before.name, active: before.active },
      after: { name: after.name, active: after.active },
    });
    return money(after);
  },

  /** Crea borrador de transferencia / cambio. */
  async createTransferDraft(
    ctx: AdRequestContext,
    input: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      rateBsPerUsd?: number;
      counterAmount?: number;
      concept?: string;
      reference?: string;
      asExchange?: boolean;
      originalSaleAmount?: number;
      originalSaleCurrency?: "USD" | "BS";
    },
  ) {
    requireAdPermission(
      ctx,
      input.asExchange ? "finance.exchange" : "finance.transfer",
    );
    const prisma = getPrisma();
    const from = await prisma.adFinancialAccount.findFirst({
      where: { id: input.fromAccountId, tenantId: ctx.tenantId },
    });
    const to = await prisma.adFinancialAccount.findFirst({
      where: { id: input.toAccountId, tenantId: ctx.tenantId },
    });
    if (!from || !to) throw new NotFoundError("Cuenta no encontrada");
    if (from.id === to.id) throw new ValidationError("Origen y destino iguales");

    let counterAmount = input.counterAmount;
    let rateUsed: number | null = null;
    if (from.currency === to.currency) {
      counterAmount = input.amount;
    } else {
      const conv = convertBetweenCurrencies({
        amount: input.amount,
        from: from.currency,
        to: to.currency,
        rateBsPerUsd: input.rateBsPerUsd,
      });
      counterAmount = input.counterAmount ?? conv.amountOut;
      rateUsed = conv.rateUsed;
    }

    const type =
      input.asExchange || from.currency !== to.currency
        ? "CAMBIO_MONEDA"
        : "TRANSFERENCIA";

    let fxDifference: number | null = null;
    if (
      type === "CAMBIO_MONEDA" &&
      input.originalSaleAmount != null &&
      rateUsed
    ) {
      fxDifference =
        (counterAmount ?? 0) - input.originalSaleAmount * (from.currency === "USD" ? rateUsed : 1 / rateUsed);
    }

    const draft = await prisma.adFinancialMovement.create({
      data: {
        tenantId: ctx.tenantId,
        type,
        status: "DRAFT",
        accountId: from.id,
        counterAccountId: to.id,
        currency: from.currency,
        amount: dec(input.amount),
        counterAmount: counterAmount != null ? dec(counterAmount) : null,
        counterCurrency: to.currency,
        rateUsed: rateUsed != null ? dec(rateUsed) : null,
        concept: input.concept,
        reference: input.reference,
        operatorId: ctx.operator.id,
        originalSaleAmount:
          input.originalSaleAmount != null
            ? dec(input.originalSaleAmount)
            : null,
        originalSaleCurrency: input.originalSaleCurrency,
        fxDifference: fxDifference != null ? dec(fxDifference) : null,
      },
      include: { account: true, counterAccount: true },
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "create",
      entity: "financial_movement",
      entityId: draft.id,
      after: { type, status: "DRAFT", amount: input.amount },
    });

    return this.movementDoc(draft);
  },

  async totalizeMovement(ctx: AdRequestContext, id: string) {
    requireAdPermission(ctx, "finance.view");
    const prisma = getPrisma();
    const m = await prisma.adFinancialMovement.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { account: true, counterAccount: true },
    });
    if (!m) throw new NotFoundError("Movimiento no encontrado");
    if (m.status !== "DRAFT" && m.status !== "PRELIMINARY") {
      throw new ValidationError("Estado no permite totalizar");
    }
    const updated = await prisma.adFinancialMovement.update({
      where: { id },
      data: { status: "PRELIMINARY" },
      include: { account: true, counterAccount: true },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "totalize",
      entity: "financial_movement",
      entityId: id,
      before: { status: m.status },
      after: { status: "PRELIMINARY" },
    });
    return this.movementDoc(updated);
  },

  async confirmMovement(ctx: AdRequestContext, id: string) {
    const prisma = getPrisma();
    const before = await prisma.adFinancialMovement.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { account: true, counterAccount: true },
    });
    if (!before) throw new NotFoundError("Movimiento no encontrado");
    if (before.status === "CONFIRMED") {
      throw new ValidationError("Ya confirmado");
    }
    if (before.status === "VOIDED") {
      throw new ValidationError("Anulado");
    }

    if (before.type === "CAMBIO_MONEDA") {
      requireAdPermission(ctx, "finance.exchange");
    } else if (before.type === "TRANSFERENCIA") {
      requireAdPermission(ctx, "finance.transfer");
    } else if (before.type === "EGRESO_GASTO") {
      requireAdPermission(ctx, "finance.expenses");
    } else if (before.type === "RETIRO") {
      requireAdPermission(ctx, "finance.withdrawals");
    } else {
      requireAdPermission(ctx, "finance.manage");
    }

    const posted = await prisma.$transaction(async (tx) => {
      // Reset account balance effect: postConfirmedMovement expects current balance
      // Draft never touched balances.
      return postConfirmedMovement(tx, {
        tenantId: ctx.tenantId,
        existingId: id,
        type: before.type,
        accountId: before.accountId,
        counterAccountId: before.counterAccountId,
        currency: before.currency,
        amount: num(before.amount),
        counterAmount: before.counterAmount != null ? num(before.counterAmount) : null,
        counterCurrency: before.counterCurrency,
        rateUsed: before.rateUsed != null ? num(before.rateUsed) : null,
        concept: before.concept,
        reference: before.reference,
        operatorId: ctx.operator.id,
        originalSaleAmount:
          before.originalSaleAmount != null
            ? num(before.originalSaleAmount)
            : null,
        originalSaleCurrency: before.originalSaleCurrency,
        fxDifference:
          before.fxDifference != null ? num(before.fxDifference) : null,
      });
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "confirm",
      entity: "financial_movement",
      entityId: id,
      before: {
        status: before.status,
        balanceBefore: num(before.account.balance),
      },
      after: {
        status: "CONFIRMED",
        balanceAfter: num(posted.balanceAfter),
        counterBalanceAfter: num(posted.counterBalanceAfter),
      },
    });

    return this.movementDoc(posted);
  },

  async createExpenseDraft(
    ctx: AdRequestContext,
    input: {
      accountId: string;
      amount: number;
      concept: string;
      reference?: string;
      type: "EGRESO_GASTO" | "RETIRO";
    },
  ) {
    requireAdPermission(
      ctx,
      input.type === "RETIRO" ? "finance.withdrawals" : "finance.expenses",
    );
    const prisma = getPrisma();
    const account = await prisma.adFinancialAccount.findFirst({
      where: { id: input.accountId, tenantId: ctx.tenantId },
    });
    if (!account) throw new NotFoundError("Cuenta no encontrada");

    const draft = await prisma.adFinancialMovement.create({
      data: {
        tenantId: ctx.tenantId,
        type: input.type,
        status: "DRAFT",
        accountId: account.id,
        currency: account.currency,
        amount: dec(input.amount),
        concept: input.concept,
        reference: input.reference,
        operatorId: ctx.operator.id,
      },
      include: { account: true, counterAccount: true },
    });
    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "create",
      entity: "financial_movement",
      entityId: draft.id,
      after: { type: input.type, amount: input.amount },
    });
    return this.movementDoc(draft);
  },

  async listMovements(
    ctx: AdRequestContext,
    query: {
      from?: string;
      to?: string;
      accountId?: string;
      currency?: "USD" | "BS";
      type?: string;
      concept?: string;
      operatorId?: string;
      status?: string;
      limit?: number;
    },
  ) {
    requireAdPermission(ctx, "finance.view");
    const prisma = getPrisma();
    const where: Prisma.AdFinancialMovementWhereInput = {
      tenantId: ctx.tenantId,
    };
    if (query.accountId) {
      where.OR = [
        { accountId: query.accountId },
        { counterAccountId: query.accountId },
      ];
    }
    if (query.currency) where.currency = query.currency;
    if (query.type) {
      where.type = query.type as Prisma.EnumAdFinancialMovementTypeFilter;
    }
    if (query.status) {
      where.status = query.status as Prisma.EnumAdFinancialDocStatusFilter;
    }
    if (query.operatorId) where.operatorId = query.operatorId;
    if (query.concept) {
      where.concept = { contains: query.concept, mode: "insensitive" };
    }
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const rows = await prisma.adFinancialMovement.findMany({
      where,
      include: { account: true, counterAccount: true },
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 100,
    });
    return rows.map((r) => this.movementDoc(r));
  },

  async getMovement(ctx: AdRequestContext, id: string) {
    requireAdPermission(ctx, "finance.view");
    const prisma = getPrisma();
    const m = await prisma.adFinancialMovement.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { account: true, counterAccount: true },
    });
    if (!m) throw new NotFoundError("Movimiento no encontrado");
    return this.movementDoc(m);
  },

  movementDoc(m: {
    id: string;
    type: string;
    status: string;
    currency: string;
    amount: Prisma.Decimal | number;
    counterAmount?: Prisma.Decimal | number | null;
    counterCurrency?: string | null;
    rateUsed?: Prisma.Decimal | number | null;
    concept?: string | null;
    reference?: string | null;
    account?: { id: string; name: string; currency: string; balance: Prisma.Decimal | number } | null;
    counterAccount?: { id: string; name: string; currency: string; balance: Prisma.Decimal | number } | null;
    balanceBefore?: Prisma.Decimal | number | null;
    balanceAfter?: Prisma.Decimal | number | null;
    counterBalanceBefore?: Prisma.Decimal | number | null;
    counterBalanceAfter?: Prisma.Decimal | number | null;
    originalSaleAmount?: Prisma.Decimal | number | null;
    originalSaleCurrency?: string | null;
    fxDifference?: Prisma.Decimal | number | null;
    confirmedAt?: Date | null;
    createdAt?: Date;
    operatorId?: string | null;
  }) {
    const amount = num(m.amount);
    const counterAmount = m.counterAmount != null ? num(m.counterAmount) : null;
    const rateUsed = m.rateUsed != null ? num(m.rateUsed) : null;
    return {
      id: m.id,
      type: m.type,
      status: m.status,
      currency: m.currency,
      amount,
      counterAmount,
      counterCurrency: m.counterCurrency,
      rateUsed,
      concept: m.concept,
      reference: m.reference,
      operatorId: m.operatorId,
      confirmedAt: m.confirmedAt,
      createdAt: m.createdAt,
      account: m.account
        ? {
            id: m.account.id,
            name: m.account.name,
            currency: m.account.currency,
            balance: num(m.account.balance),
          }
        : null,
      counterAccount: m.counterAccount
        ? {
            id: m.counterAccount.id,
            name: m.counterAccount.name,
            currency: m.counterAccount.currency,
            balance: num(m.counterAccount.balance),
          }
        : null,
      balances: {
        before: num(m.balanceBefore),
        after: num(m.balanceAfter),
        counterBefore: num(m.counterBalanceBefore),
        counterAfter: num(m.counterBalanceAfter),
      },
      originalSaleAmount: num(m.originalSaleAmount),
      originalSaleCurrency: m.originalSaleCurrency,
      fxDifference: num(m.fxDifference),
      document: {
        title:
          m.status === "CONFIRMED"
            ? `CONFIRMED · ${m.type}`
            : m.status === "PRELIMINARY"
              ? `PRELIMINAR · ${m.type}`
              : `BORRADOR · ${m.type}`,
        origin: m.account?.name,
        destination: m.counterAccount?.name ?? "—",
        amount,
        currency: m.currency,
        counterAmount,
        counterCurrency: m.counterCurrency,
        rateUsed,
        concept: m.concept,
        reference: m.reference,
      },
    };
  },

  /**
   * Costo de reposición con tasas actuales — no altera CPP ni compra histórica.
   * No expone tasa paralela salvo permiso finance.parallel_rate.
   */
  async getReplacementCost(ctx: AdRequestContext, productId: string) {
    requireAdPermission(ctx, "finance.view");
    const prisma = getPrisma();
    const product = await prisma.adProduct.findFirst({
      where: { id: productId, tenantId: ctx.tenantId },
    });
    if (!product) throw new NotFoundError("Producto no encontrado");

    const lastLine = await prisma.adPurchaseLine.findFirst({
      where: {
        productId,
        purchase: { tenantId: ctx.tenantId, status: "RECEIVED" },
      },
      orderBy: { purchase: { receivedAt: "desc" } },
      include: { purchase: true },
    });

    const historicalCostUsd =
      num(product.avgCostUsd) ||
      (lastLine
        ? num(lastLine.effectiveUnitCostUsd) || num(lastLine.unitCostUsd)
        : 0);
    const useParallel = Boolean(lastLine?.purchase.useProtectedRateRef);
    const bcv = await latestRate(ctx.tenantId, "BCV");
    const protectedRate = await latestRate(ctx.tenantId, "PROTECTED");

    const replacementUsd = replacementCostFromRates({
      historicalCostUsd,
      useParallelRef: useParallel,
      currentProtectedRate: protectedRate,
      currentBcvRate: bcv,
    });
    const replacementBs =
      bcv && bcv > 0 ? replacementUsd * bcv : num(product.replacementCostBs);

    await prisma.adProduct.update({
      where: { id: productId },
      data: {
        replacementCostUsd: dec(replacementUsd),
        replacementCostBs: dec(replacementBs),
      },
    });

    const canSee =
      ctx.permissions.has("finance.parallel_rate") ||
      ctx.permissions.has("rates.protected.manage");

    return sanitizeProtectedFromClient(
      {
        productId,
        historicalCppUsd: num(product.avgCostUsd),
        historicalCppBs: num(product.avgCostBs),
        replacementCostUsd: replacementUsd,
        replacementCostBs: replacementBs,
        useParallelRef: useParallel,
        currentBcvRate: bcv,
        currentProtectedRate: canSee ? protectedRate : undefined,
      },
      canSee,
    );
  },

  async exchangePreview(
    ctx: AdRequestContext,
    input: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      rateBsPerUsd: number;
    },
  ) {
    requireAdPermission(ctx, "finance.exchange");
    const prisma = getPrisma();
    const from = await prisma.adFinancialAccount.findFirst({
      where: { id: input.fromAccountId, tenantId: ctx.tenantId },
    });
    const to = await prisma.adFinancialAccount.findFirst({
      where: { id: input.toAccountId, tenantId: ctx.tenantId },
    });
    if (!from || !to) throw new NotFoundError("Cuenta no encontrada");
    const conv = convertBetweenCurrencies({
      amount: input.amount,
      from: from.currency,
      to: to.currency,
      rateBsPerUsd: input.rateBsPerUsd,
    });
    return {
      before: {
        origin: { id: from.id, name: from.name, balance: num(from.balance), currency: from.currency },
        destination: { id: to.id, name: to.name, balance: num(to.balance), currency: to.currency },
      },
      operation: {
        amountIn: input.amount,
        currencyIn: from.currency,
        rateBsPerUsd: input.rateBsPerUsd,
        amountOut: conv.amountOut,
        currencyOut: to.currency,
        /** Valor original / convertido / impacto (analítica; no altera venta). */
        originalValue: input.amount,
        convertedValue: conv.amountOut,
        rateUsed: conv.rateUsed,
        /** Diferencia de representación monetaria (destino − origen convertido 1:1 no aplica).
         * No se etiqueta automáticamente como pérdida/ganancia: solo se reporta el delta
         * cuando hay originalSaleAmount explícito. */
        fxDifference: null as number | null,
        impactNote:
          "La conversión cambia la representación monetaria; no implica pérdida automática.",
      },
      after: {
        origin: {
          balance: num(from.balance) - input.amount,
          currency: from.currency,
        },
        destination: {
          balance: num(to.balance) + conv.amountOut,
          currency: to.currency,
        },
      },
    };
  },

  /**
   * Preview de conciliación: ingresos/egresos/transferencias y saldos.
   * calculatedBalance = opening + Σ signos del período.
   * systemBalance = balance actual de la cuenta.
   */
  async reconciliationPreview(
    ctx: AdRequestContext,
    input: { accountId: string; from?: string; to?: string },
  ) {
    requireAdPermission(ctx, "finance.reconcile");
    const prisma = getPrisma();
    const account = await prisma.adFinancialAccount.findFirst({
      where: { id: input.accountId, tenantId: ctx.tenantId },
    });
    if (!account) throw new NotFoundError("Cuenta no encontrada");

    const today = new Date().toISOString().slice(0, 10);
    const fromDate = (input.from ?? today).slice(0, 10);
    const toDate = (input.to ?? today).slice(0, 10);
    const { from, toExclusive } = dayBounds(fromDate, toDate);

    const movements = await prisma.adFinancialMovement.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: "CONFIRMED",
        OR: [
          { accountId: account.id },
          { counterAccountId: account.id },
        ],
        confirmedAt: { gte: from, lt: toExclusive },
      },
      orderBy: { confirmedAt: "asc" },
    });

    let income = 0;
    let expense = 0;
    let transfersIn = 0;
    let transfersOut = 0;
    let periodDelta = 0;

    for (const m of movements) {
      const role =
        m.accountId === account.id ? ("primary" as const) : ("counter" as const);
      const amt =
        role === "primary"
          ? num(m.amount)
          : num(m.counterAmount ?? m.amount);
      const sign = movementSignForAccount(m.type, role);
      const delta = sign * amt;
      periodDelta += delta;

      if (m.type === "INGRESO_VENTA" && role === "primary") income += amt;
      else if (
        (m.type === "EGRESO_COMPRA" ||
          m.type === "EGRESO_GASTO" ||
          m.type === "RETIRO") &&
        role === "primary"
      ) {
        expense += amt;
      } else if (m.type === "TRANSFERENCIA" || m.type === "CAMBIO_MONEDA") {
        if (sign > 0) transfersIn += amt;
        else transfersOut += amt;
      } else if (m.type === "INGRESO_VENTA") {
        income += amt;
      }
    }

    const openingBalance = num(account.openingBalance);
    /** opening + todos los confirmados hasta fin de período ≈ system; aquí usamos period delta. */
    const priorMoves = await prisma.adFinancialMovement.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: "CONFIRMED",
        OR: [{ accountId: account.id }, { counterAccountId: account.id }],
        confirmedAt: { lt: from },
      },
    });
    let openingCalculated = openingBalance;
    for (const m of priorMoves) {
      const role =
        m.accountId === account.id ? ("primary" as const) : ("counter" as const);
      const amt =
        role === "primary"
          ? num(m.amount)
          : num(m.counterAmount ?? m.amount);
      openingCalculated += movementSignForAccount(m.type, role) * amt;
    }

    const calculatedBalance = openingCalculated + periodDelta;
    const systemBalance = num(account.balance);

    return {
      account: {
        id: account.id,
        name: account.name,
        currency: account.currency,
        type: account.type,
      },
      period: { from: fromDate, to: toDate },
      openingBalance: openingCalculated,
      income,
      expense,
      transfersIn,
      transfersOut,
      calculatedBalance,
      systemBalance,
      movementsCount: movements.length,
    };
  },

  async createReconciliation(
    ctx: AdRequestContext,
    input: {
      accountId: string;
      asOfDate: string;
      from?: string;
      to?: string;
      declaredBalance: number;
      notes?: string;
    },
  ) {
    requireAdPermission(ctx, "finance.reconcile");
    const preview = await this.reconciliationPreview(ctx, {
      accountId: input.accountId,
      from: input.from ?? input.asOfDate,
      to: input.to ?? input.asOfDate,
    });
    const difference = input.declaredBalance - preview.systemBalance;
    const prisma = getPrisma();
    const row = await prisma.adFinancialReconciliation.create({
      data: {
        tenantId: ctx.tenantId,
        accountId: input.accountId,
        currency: preview.account.currency as "USD" | "BS",
        asOfDate: new Date(`${input.asOfDate.slice(0, 10)}T00:00:00.000Z`),
        periodFrom: new Date(
          `${(input.from ?? input.asOfDate).slice(0, 10)}T00:00:00.000Z`,
        ),
        periodTo: new Date(
          `${(input.to ?? input.asOfDate).slice(0, 10)}T00:00:00.000Z`,
        ),
        openingBalance: dec(preview.openingBalance),
        income: dec(preview.income),
        expense: dec(preview.expense),
        transfersIn: dec(preview.transfersIn),
        transfersOut: dec(preview.transfersOut),
        calculatedBalance: dec(preview.calculatedBalance),
        systemBalance: dec(preview.systemBalance),
        declaredBalance: dec(input.declaredBalance),
        difference: dec(difference),
        notes: input.notes,
        operatorId: ctx.operator.id,
      },
      include: { account: true },
    });

    await writeAdAudit({
      tenantId: ctx.tenantId,
      operatorId: ctx.operator.id,
      action: "create",
      entity: "financial_reconciliation",
      entityId: row.id,
      after: {
        accountId: row.accountId,
        declaredBalance: input.declaredBalance,
        systemBalance: preview.systemBalance,
        calculatedBalance: preview.calculatedBalance,
        difference,
        notes: input.notes,
      },
    });

    return {
      ...row,
      openingBalance: num(row.openingBalance),
      income: num(row.income),
      expense: num(row.expense),
      transfersIn: num(row.transfersIn),
      transfersOut: num(row.transfersOut),
      calculatedBalance: num(row.calculatedBalance),
      systemBalance: num(row.systemBalance),
      declaredBalance: num(row.declaredBalance),
      difference: num(row.difference),
    };
  },

  async listReconciliations(
    ctx: AdRequestContext,
    query?: { accountId?: string; limit?: number },
  ) {
    requireAdPermission(ctx, "finance.reconcile");
    const prisma = getPrisma();
    const rows = await prisma.adFinancialReconciliation.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(query?.accountId ? { accountId: query.accountId } : {}),
      },
      include: { account: { select: { id: true, name: true, currency: true } } },
      orderBy: { createdAt: "desc" },
      take: query?.limit ?? 50,
    });
    return rows.map((r) => ({
      ...r,
      openingBalance: num(r.openingBalance),
      income: num(r.income),
      expense: num(r.expense),
      transfersIn: num(r.transfersIn),
      transfersOut: num(r.transfersOut),
      calculatedBalance: num(r.calculatedBalance),
      systemBalance: num(r.systemBalance),
      declaredBalance: num(r.declaredBalance),
      difference: num(r.difference),
    }));
  },
};

void ForbiddenError;
