import { z } from "zod";

export { parseBody } from "./validation.js";

export const createFinancialAccountSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().max(64).optional(),
  type: z.enum(["BANK", "CASH", "TILL", "DIGITAL", "OTHER"]).default("BANK"),
  currency: z.enum(["USD", "BS"]),
  openingBalance: z.number().default(0),
  warehouseId: z.string().uuid().optional(),
  paymentMethodId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
  active: z.boolean().optional(),
});

export const updateFinancialAccountSchema = createFinancialAccountSchema
  .partial()
  .extend({
    name: z.string().min(1).max(200).optional(),
    currency: z.enum(["USD", "BS"]).optional(),
  });

export const createTransferSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().positive(),
  /** Obligatorio si monedas distintas (Bs por 1 USD). */
  rateBsPerUsd: z.number().positive().optional(),
  counterAmount: z.number().positive().optional(),
  concept: z.string().max(500).optional(),
  reference: z.string().max(120).optional(),
});

export const createExchangeSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().positive(),
  rateBsPerUsd: z.number().positive(),
  concept: z.string().max(500).optional(),
  reference: z.string().max(120).optional(),
  /** Monto original de venta (analítica; no altera factura). */
  originalSaleAmount: z.number().nonnegative().optional(),
  originalSaleCurrency: z.enum(["USD", "BS"]).optional(),
});

export const createExpenseSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().positive(),
  concept: z.string().min(1).max(500),
  reference: z.string().max(120).optional(),
  type: z.enum(["EGRESO_GASTO", "RETIRO"]).default("EGRESO_GASTO"),
});

export const listMovementsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  accountId: z.string().uuid().optional(),
  currency: z.enum(["USD", "BS"]).optional(),
  type: z
    .enum([
      "INGRESO_VENTA",
      "EGRESO_COMPRA",
      "EGRESO_GASTO",
      "RETIRO",
      "TRANSFERENCIA",
      "CAMBIO_MONEDA",
      "AJUSTE",
      "OTROS",
    ])
    .optional(),
  concept: z.string().max(200).optional(),
  operatorId: z.string().uuid().optional(),
  status: z
    .enum(["DRAFT", "PRELIMINARY", "CONFIRMED", "VOIDED"])
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const updateFinanceSettingsSchema = z.object({
  parallelRateHotkey: z.string().min(1).max(64).optional(),
  pricingCriticalUtilityPercent: z.number().min(0).max(100).optional(),
  inventoryCriticalCoverageDays: z.number().int().min(0).max(365).optional(),
  inventoryWarnCoverageDays: z.number().int().min(0).max(365).optional(),
});

export const payablePaymentWithAccountSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["USD", "BS"]),
  paymentMethodId: z.string().uuid().optional(),
  financialAccountId: z.string().uuid().optional(),
  reference: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

/** Preview de conciliación: from/to inclusivos YYYY-MM-DD o ISO. */
export const reconciliationPreviewSchema = z.object({
  accountId: z.string().uuid(),
  from: z.string().min(8).optional(),
  to: z.string().min(8).optional(),
});

export const createReconciliationSchema = z.object({
  accountId: z.string().uuid(),
  asOfDate: z.string().min(8),
  from: z.string().min(8).optional(),
  to: z.string().min(8).optional(),
  declaredBalance: z.number(),
  notes: z.string().max(1000).optional(),
});
