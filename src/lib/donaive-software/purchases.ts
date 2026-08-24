/**
 * Confirmar compra: actualiza CPP, stock y PVP; persiste historial.
 */

import { applyWeightedCpp, pricesFromCpp } from "@/lib/donaive-software/cpp";
import { computeLineRealCosts } from "@/lib/donaive-software/purchase-invoice";
import type { DsDraftLine } from "@/lib/donaive-software/purchase-draft";
import { amountToDisplay, type DsRateContext } from "@/lib/donaive-software/rates";
import type { DsProduct, DsPurchase } from "@/types/donaive-software";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function realUnitToUsd(
  realUnit: number,
  currency: "USD" | "BS",
  ctx: DsRateContext,
): number {
  if (currency === "USD") return realUnit;
  const disp = amountToDisplay(realUnit, {
    ...ctx,
    currency: "BS",
  });
  return disp.usd;
}

export type ConfirmPurchaseInput = {
  products: DsProduct[];
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  currency: "USD" | "BS";
  invoiceRate?: number;
  extraTaxes: DsPurchase["extraTaxes"];
  lines: DsDraftLine[];
  notes?: string;
  createdBy?: string;
  rateCtx: DsRateContext;
};

export function confirmPurchase(
  input: ConfirmPurchaseInput,
): { ok: true; products: DsProduct[]; purchase: DsPurchase } | { ok: false; error: string } {
  if (!input.lines.length) {
    return { ok: false, error: "Agregue al menos una línea" };
  }
  if (!input.supplierName.trim()) {
    return { ok: false, error: "Indique el proveedor" };
  }

  const totals = computeLineRealCosts(input.lines, input.extraTaxes, {
    currency: input.currency,
    invoiceRate: input.invoiceRate,
    bcv: input.rateCtx.bcv,
  });

  const products = [...input.products];

  for (const line of input.lines) {
    const real = totals.lineRealCosts.get(line.key);
    if (!real) continue;
    const idx = products.findIndex((p) => p.id === line.productId);
    if (idx < 0) {
      return { ok: false, error: `Producto no encontrado: ${line.productLabel}` };
    }

    const unitCostUsd = realUnitToUsd(
      real.realUnit,
      input.currency,
      input.rateCtx,
    );
    const p = products[idx];
    const nextStock = applyWeightedCpp(
      p.stock,
      real.qtyReceived,
      unitCostUsd,
    );
    const px = pricesFromCpp(
      nextStock.unitCostUsd,
      p.unitsPerBox,
      line.utilityPercent,
    );
    products[idx] = {
      ...p,
      stock: nextStock,
      saleUnitUsd: px.unitSale,
      saleBoxUsd: px.boxSale,
      utilityPercent: line.utilityPercent,
    };
  }

  const purchase: DsPurchase = {
    id: uid("pur"),
    supplierName: input.supplierName.trim(),
    invoiceNumber: input.invoiceNumber.trim(),
    invoiceDate: input.invoiceDate,
    currency: input.currency,
    invoiceRate: input.invoiceRate,
    extraTaxes: input.extraTaxes,
    lines: input.lines.map((l) => ({ ...l })),
    notes: input.notes?.trim() || undefined,
    subtotal: totals.subtotal,
    tax: totals.tax,
    extraTaxesTotal: totals.extraTaxesTotal,
    extraTaxesTotalBs: totals.extraTaxesTotalBs,
    grandTotal: totals.grandTotal,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
  };

  return { ok: true, products, purchase };
}
