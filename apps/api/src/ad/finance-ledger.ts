/**
 * Ledger financiero A&D — helpers transaccionales reutilizables.
 */
import { Prisma } from "@prisma/client";
import { ValidationError, NotFoundError } from "../errors/app-error.js";
import { convertBetweenCurrencies } from "./finance-domain.js";

function dec(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n);
}

function num(v: Prisma.Decimal | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

export type LedgerTx = Prisma.TransactionClient;

export async function resolveAccountForPaymentMethod(
  tx: LedgerTx,
  tenantId: string,
  opts: {
    paymentMethodId?: string | null;
    methodName?: string | null;
    currency: "USD" | "BS";
  },
) {
  if (opts.paymentMethodId) {
    const pm = await tx.adPaymentMethod.findFirst({
      where: { id: opts.paymentMethodId, tenantId },
      include: { financialAccount: true },
    });
    if (pm?.financialAccount && pm.financialAccount.currency === opts.currency) {
      return { method: pm, account: pm.financialAccount };
    }
  }
  if (opts.methodName?.trim()) {
    const q = opts.methodName.trim();
    const pm = await tx.adPaymentMethod.findFirst({
      where: {
        tenantId,
        currency: opts.currency,
        active: true,
        OR: [
          { code: { equals: q, mode: "insensitive" } },
          { name: { equals: q, mode: "insensitive" } },
        ],
      },
      include: { financialAccount: true },
    });
    if (pm?.financialAccount) {
      return { method: pm, account: pm.financialAccount };
    }
  }
  return null;
}

/**
 * Postea movimiento confirmado y actualiza saldos en la misma transacción.
 * Para TRANSFERENCIA / CAMBIO_MONEDA: resta origen y suma destino.
 */
export async function postConfirmedMovement(
  tx: LedgerTx,
  input: {
    tenantId: string;
    type:
      | "INGRESO_VENTA"
      | "EGRESO_COMPRA"
      | "EGRESO_GASTO"
      | "RETIRO"
      | "TRANSFERENCIA"
      | "CAMBIO_MONEDA"
      | "AJUSTE"
      | "OTROS";
    accountId: string;
    counterAccountId?: string | null;
    currency: "USD" | "BS";
    amount: number;
    counterAmount?: number | null;
    counterCurrency?: "USD" | "BS" | null;
    rateUsed?: number | null;
    concept?: string | null;
    reference?: string | null;
    relatedEntity?: string | null;
    relatedId?: string | null;
    saleId?: string | null;
    purchaseId?: string | null;
    payableId?: string | null;
    operatorId?: string | null;
    warehouseId?: string | null;
    originalSaleAmount?: number | null;
    originalSaleCurrency?: "USD" | "BS" | null;
    fxDifference?: number | null;
    /** Si se pasa un id de borrador/preliminar, se actualiza en lugar de crear. */
    existingId?: string | null;
  },
) {
  const account = await tx.adFinancialAccount.findFirst({
    where: { id: input.accountId, tenantId: input.tenantId },
  });
  if (!account) throw new NotFoundError("Cuenta financiera no encontrada");
  if (!account.active) throw new ValidationError("Cuenta inactiva");
  if (account.currency !== input.currency) {
    throw new ValidationError("Moneda del movimiento no coincide con la cuenta");
  }
  if (!(input.amount > 0)) throw new ValidationError("Monto inválido");

  const isTransferLike =
    input.type === "TRANSFERENCIA" || input.type === "CAMBIO_MONEDA";

  let counter = null as Awaited<
    ReturnType<typeof tx.adFinancialAccount.findFirst>
  >;
  if (isTransferLike) {
    if (!input.counterAccountId) {
      throw new ValidationError("Cuenta destino requerida");
    }
    counter = await tx.adFinancialAccount.findFirst({
      where: { id: input.counterAccountId, tenantId: input.tenantId },
    });
    if (!counter) throw new NotFoundError("Cuenta destino no encontrada");
    if (!counter.active) throw new ValidationError("Cuenta destino inactiva");
  }

  let counterAmount = input.counterAmount ?? null;
  let counterCurrency = input.counterCurrency ?? null;
  let rateUsed = input.rateUsed ?? null;

  if (isTransferLike && counter) {
    if (account.currency === counter.currency) {
      counterAmount = input.amount;
      counterCurrency = account.currency;
      rateUsed = null;
    } else {
      if (!(rateUsed && rateUsed > 0) && !(counterAmount && counterAmount > 0)) {
        throw new ValidationError(
          "Tasa explícita (o monto destino) obligatoria para cambio de moneda",
        );
      }
      if (counterAmount == null || !(counterAmount > 0)) {
        const conv = convertBetweenCurrencies({
          amount: input.amount,
          from: account.currency,
          to: counter.currency,
          rateBsPerUsd: rateUsed!,
        });
        counterAmount = conv.amountOut;
        rateUsed = conv.rateUsed;
      }
      counterCurrency = counter.currency;
    }
  }

  const balBefore = num(account.balance);
  let balAfter = balBefore;
  let counterBefore: number | null = null;
  let counterAfter: number | null = null;

  if (isTransferLike && counter && counterAmount != null) {
    if (balBefore + 1e-9 < input.amount) {
      throw new ValidationError("Saldo insuficiente en cuenta origen");
    }
    balAfter = balBefore - input.amount;
    counterBefore = num(counter.balance);
    counterAfter = counterBefore + counterAmount;
    await tx.adFinancialAccount.update({
      where: { id: account.id },
      data: { balance: dec(balAfter) },
    });
    await tx.adFinancialAccount.update({
      where: { id: counter.id },
      data: { balance: dec(counterAfter) },
    });
  } else if (
    input.type === "EGRESO_COMPRA" ||
    input.type === "EGRESO_GASTO" ||
    input.type === "RETIRO"
  ) {
    if (balBefore + 1e-9 < input.amount) {
      throw new ValidationError("Saldo insuficiente");
    }
    balAfter = balBefore - input.amount;
    await tx.adFinancialAccount.update({
      where: { id: account.id },
      data: { balance: dec(balAfter) },
    });
  } else {
    // INGRESO_VENTA / AJUSTE / OTROS → suma
    balAfter = balBefore + input.amount;
    await tx.adFinancialAccount.update({
      where: { id: account.id },
      data: { balance: dec(balAfter) },
    });
  }

  const data = {
    tenantId: input.tenantId,
    type: input.type,
    status: "CONFIRMED" as const,
    accountId: input.accountId,
    counterAccountId: input.counterAccountId ?? null,
    currency: input.currency,
    amount: dec(input.amount),
    counterAmount: counterAmount != null ? dec(counterAmount) : null,
    counterCurrency,
    rateUsed: rateUsed != null ? dec(rateUsed) : null,
    concept: input.concept ?? null,
    reference: input.reference ?? null,
    relatedEntity: input.relatedEntity ?? null,
    relatedId: input.relatedId ?? null,
    saleId: input.saleId ?? null,
    purchaseId: input.purchaseId ?? null,
    payableId: input.payableId ?? null,
    operatorId: input.operatorId ?? null,
    warehouseId: input.warehouseId ?? null,
    balanceBefore: dec(balBefore),
    balanceAfter: dec(balAfter),
    counterBalanceBefore: counterBefore != null ? dec(counterBefore) : null,
    counterBalanceAfter: counterAfter != null ? dec(counterAfter) : null,
    originalSaleAmount:
      input.originalSaleAmount != null ? dec(input.originalSaleAmount) : null,
    originalSaleCurrency: input.originalSaleCurrency ?? null,
    fxDifference: input.fxDifference != null ? dec(input.fxDifference) : null,
    confirmedAt: new Date(),
  };

  if (input.existingId) {
    return tx.adFinancialMovement.update({
      where: { id: input.existingId },
      data,
      include: { account: true, counterAccount: true },
    });
  }
  return tx.adFinancialMovement.create({
    data,
    include: { account: true, counterAccount: true },
  });
}
