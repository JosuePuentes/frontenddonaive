import { z } from "zod";

export { parseBody } from "./validation.js";

export const searchProductsSchema = z.object({
  q: z.string().max(200).optional(),
  sku: z.string().max(80).optional(),
  barcode: z.string().max(80).optional(),
  brand: z.string().max(120).optional(),
  warehouseId: z.string().uuid().optional(),
  active: z.enum(["true", "false", "all"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(200),
  identification: z.string().max(80).optional(),
  phone: z.string().max(40).optional(),
  contactName: z.string().max(120).optional(),
  address: z.string().max(400).optional(),
  email: z.string().email().max(200).optional().or(z.literal("")),
  defaultCurrency: z.enum(["USD", "BS"]).optional(),
  creditDays: z.number().int().min(0).max(3650).optional(),
  creditLimit: z.number().nonnegative().optional(),
  notes: z.string().max(1000).optional(),
  active: z.boolean().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const commercePurchaseLineSchema = z.object({
  presentationId: z.string().uuid(),
  qty: z.number().positive(),
  qtyBonus: z.number().nonnegative().optional(),
  costMode: z.enum(["UNIT", "PRESENTATION", "TOTAL"]).default("UNIT"),
  unitCostUsd: z.number().nonnegative().optional(),
  unitCostBs: z.number().nonnegative().optional(),
  presentationCostUsd: z.number().nonnegative().optional(),
  presentationCostBs: z.number().nonnegative().optional(),
  lineTotalUsd: z.number().nonnegative().optional(),
  lineTotalBs: z.number().nonnegative().optional(),
  taxable: z.boolean().optional(),
  taxRate: z.number().min(0).max(1).optional(),
});

export const updateCommercePurchaseLineSchema = commercePurchaseLineSchema
  .partial()
  .extend({
    presentationId: z.string().uuid().optional(),
  });

export const createProductFromPurchaseSchema = z.object({
  sku: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  brand: z.string().max(120).optional(),
  categoryId: z.string().uuid().optional(),
  description: z.string().max(1000).optional(),
  baseUnitLabel: z.string().max(40).optional(),
  taxable: z.boolean().optional(),
  presentationName: z.string().max(120).optional(),
  unitsPerPresentation: z.number().positive().optional(),
  barcode: z.string().max(80).optional(),
  priceUsd: z.number().nonnegative().optional(),
  priceBs: z.number().nonnegative().optional(),
});

export const createCommercePurchaseSchema = z.object({
  warehouseId: z.string().uuid(),
  supplierId: z.string().uuid().optional(),
  supplierName: z.string().min(1).max(200).optional(),
  invoiceNumber: z.string().min(1).max(80),
  invoiceDate: z.string().datetime().optional(),
  currency: z.enum(["USD", "BS"]).default("USD"),
  paymentMethodId: z.string().uuid().optional(),
  paymentCondition: z.enum(["CONTADO", "CREDITO"]).default("CONTADO"),
  creditDays: z.number().int().min(0).max(3650).optional(),
  dueDate: z.string().datetime().optional(),
  reference: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
  useProtectedRateRef: z.boolean().optional(),
  preliminary: z.boolean().optional(),
  lines: z.array(commercePurchaseLineSchema).min(1),
});

/** Sincroniza la misma compra DRAFT/PRELIMINARY (mismo purchaseId). */
export const updateCommercePurchaseSchema = createCommercePurchaseSchema;

export const confirmPurchaseSchema = z.object({
  receive: z.boolean().optional(),
});

export const setBcvRateSchema = z.object({
  rate: z.number().positive(),
  reason: z.string().max(500).optional(),
  effectiveAt: z.string().datetime().optional(),
});

export const setProtectedRateSchema = z.object({
  rate: z.number().positive(),
  reason: z.string().max(500).optional(),
  effectiveAt: z.string().datetime().optional(),
});

export const upsertPaymentMethodSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  currency: z.enum(["USD", "BS"]),
  active: z.boolean().optional(),
  accountLabel: z.string().max(120).optional(),
  usesSpecialRateRef: z.boolean().optional(),
  requiresReference: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  financialAccountId: z.string().uuid().optional().nullable(),
});

export const setPresentationPriceSchema = z.object({
  presentationId: z.string().uuid(),
  kind: z.enum(["NORMAL", "PROMOCION", "ESPECIAL", "METODO_PAGO"]).default("NORMAL"),
  name: z.string().max(120).optional(),
  currency: z.enum(["USD", "BS"]).default("USD"),
  /** Precio directo XOR utilidad % */
  price: z.number().positive().optional(),
  utilityPercent: z.number().optional(),
  paymentMethodId: z.string().uuid().optional(),
  costBasis: z.number().nonnegative().optional(),
  continueBelowCost: z.boolean().optional(),
  belowCostReason: z.string().max(500).optional(),
  active: z.boolean().optional(),
});

export const createPromotionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  currency: z.enum(["USD", "BS"]).default("USD"),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  active: z.boolean().optional(),
  paymentMethodIds: z.array(z.string().uuid()).default([]),
  items: z
    .array(
      z.object({
        presentationId: z.string().uuid(),
        qty: z.number().positive().default(1),
        price: z.number().positive(),
      }),
    )
    .min(1),
});

export const updatePromotionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  active: z.boolean().optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  paymentMethodIds: z.array(z.string().uuid()).optional(),
});

export const updatePurchaseOrderSchema = z.object({
  status: z.enum(["PRELIMINARY", "CONFIRMED", "CANCELLED"]).optional(),
  notes: z.string().max(1000).optional(),
  lines: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        productId: z.string().uuid(),
        presentationId: z.string().uuid().optional(),
        suggestedQtyBase: z.number().nonnegative(),
        qtyBase: z.number().nonnegative(),
        notes: z.string().max(500).optional(),
      }),
    )
    .optional(),
});

export const convertPurchaseOrderSchema = z.object({
  invoiceNumber: z.string().min(1).max(80),
  currency: z.enum(["USD", "BS"]).optional(),
  paymentCondition: z.enum(["CONTADO", "CREDITO"]).optional(),
  paymentMethodId: z.string().uuid().optional(),
  creditDays: z.number().int().min(0).max(3650).optional(),
  dueDate: z.string().datetime().optional(),
  useProtectedRateRef: z.boolean().optional(),
  confirm: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid(),
        presentationId: z.string().uuid(),
        qty: z.number().positive(),
        qtyBonus: z.number().nonnegative().optional(),
        costMode: z.enum(["UNIT", "PRESENTATION", "TOTAL"]).optional(),
        unitCostUsd: z.number().nonnegative().optional(),
        unitCostBs: z.number().nonnegative().optional(),
        presentationCostUsd: z.number().nonnegative().optional(),
        presentationCostBs: z.number().nonnegative().optional(),
        lineTotalUsd: z.number().nonnegative().optional(),
        lineTotalBs: z.number().nonnegative().optional(),
        taxable: z.boolean().optional(),
      }),
    )
    .optional(),
});

export const createComboSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  currency: z.enum(["USD", "BS"]).default("USD"),
  price: z.number().positive(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  active: z.boolean().optional(),
  paymentMethodIds: z.array(z.string().uuid()).default([]),
  items: z
    .array(
      z.object({
        presentationId: z.string().uuid(),
        qty: z.number().positive(),
      }),
    )
    .min(1),
});

export const replenishmentSchema = z.object({
  warehouseId: z.string().uuid().optional(),
  coverageDays: z.coerce.number().positive().default(7),
  windowDays: z.coerce.number().int().positive().max(365).default(30),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  coverageDays: z.number().int().positive().optional(),
  expectedAt: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
  preliminary: z.boolean().optional(),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid(),
        presentationId: z.string().uuid().optional(),
        suggestedQtyBase: z.number().nonnegative(),
        qtyBase: z.number().positive(),
        notes: z.string().max(400).optional(),
      }),
    )
    .min(1),
});

export const importPreviewSchema = z.object({
  fileName: z.string().max(200).optional(),
  rows: z
    .array(
      z.object({
        code: z.string().max(80).optional(),
        barcode: z.string().max(80).optional(),
        description: z.string().max(400).optional(),
        brand: z.string().max(120).optional(),
        presentation: z.string().max(120).optional(),
        unitsPerPresentation: z.number().positive().optional(),
        qty: z.number().nonnegative().optional(),
        unitCost: z.number().nonnegative().optional(),
        presentationCost: z.number().nonnegative().optional(),
        lineTotal: z.number().nonnegative().optional(),
        currency: z.enum(["USD", "BS"]).optional(),
        action: z.enum(["create", "update", "skip"]).optional(),
      }),
    )
    .min(1)
    .max(5000),
});

export const importConfirmSchema = z.object({
  batchId: z.string().uuid(),
});

export const payablePaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["USD", "BS"]),
  paymentMethodId: z.string().uuid().optional(),
  financialAccountId: z.string().uuid().optional(),
  reference: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});
