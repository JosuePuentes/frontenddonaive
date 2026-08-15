import { z } from "zod";
import { ValidationError } from "../errors/app-error.js";

export const createWarehouseSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().min(1).max(32),
  tenantId: z.string().uuid().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(120).optional(),
  sku: z.string().max(64).optional(),
  barcode: z.string().max(64).optional(),
  description: z.string().max(2000).optional(),
  baseUnitLabel: z.string().min(1).max(32).default("u"),
  categoryId: z.string().uuid().optional(),
  minStockBase: z.number().nonnegative().optional(),
  tenantId: z.string().uuid().optional(),
});

export const createPresentationSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().max(64).optional(),
  unitsPerPresentation: z.number().positive(),
  priceUsd: z.number().nonnegative(),
  priceBs: z.number().nonnegative(),
  minPriceUsd: z.number().nonnegative().optional(),
  maxPriceUsd: z.number().nonnegative().optional(),
  sku: z.string().max(64).optional(),
  barcode: z.string().max(64).optional(),
});

export const setStockSchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  qtyBase: z.number(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(3).max(40),
  document: z.string().max(40).optional(),
  tenantId: z.string().uuid().optional(),
});

export const createSaleSchema = z.object({
  warehouseId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
  lines: z
    .array(
      z.object({
        presentationId: z.string().uuid(),
        qty: z.number().positive(),
      }),
    )
    .min(1),
  payments: z
    .array(
      z.object({
        method: z.string().min(1).max(64),
        currency: z.enum(["USD", "BS"]),
        amount: z.number().positive(),
        reference: z.string().max(120).optional(),
        bank: z.string().max(120).optional(),
      }),
    )
    .optional(),
});

export const loginOperatorSchema = z.object({
  tenantId: z.string().uuid(),
  username: z.string().min(1).max(64),
  password: z.string().min(6).max(200),
});

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError("Payload inválido", result.error.flatten());
  }
  return result.data;
}
