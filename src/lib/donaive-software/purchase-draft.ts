/**
 * Borrador de línea de compra — misma lógica caja/unidad que A&D Compras.
 */

import { pricesFromCpp } from "@/lib/donaive-software/cpp";
import {
  amountToDisplay,
  type DsRateContext,
} from "@/lib/donaive-software/rates";
import type { DsProduct, DsPurchaseLine } from "@/types/donaive-software";

export type DsDraftLine = DsPurchaseLine;

export function productToDraftLine(
  p: DsProduct,
  prefer: "UNIT" | "BOX" = "BOX",
): DsDraftLine {
  const hasBox = p.unitsPerBox > 1;
  const buyMode: "UNIT" | "BOX" = hasBox ? prefer : "UNIT";
  return {
    key: `draft-${p.id}-${Date.now()}`,
    productId: p.id,
    productLabel: `${p.sku} ${p.name}`.trim(),
    sku: p.sku,
    unitsPerBox: Math.max(1, p.unitsPerBox),
    buyMode,
    qty: 1,
    qtyBonus: 0,
    costMode: buyMode === "BOX" ? "PRESENTATION" : "UNIT",
    unitCost: 0,
    presentationCost: 0,
    lineTotal: 0,
    taxable: p.taxable,
    utilityPercent: p.utilityPercent,
  };
}

export function lineUnitsPerPresentation(l: DsDraftLine): number {
  if (l.buyMode === "UNIT") return 1;
  return Math.max(1, l.unitsPerBox);
}

export function lineQtyBase(l: DsDraftLine): number {
  return Math.max(0, l.qty) * lineUnitsPerPresentation(l);
}

export function lineQtyReceived(l: DsDraftLine): number {
  return lineQtyBase(l) + Math.max(0, l.qtyBonus);
}

export function formatLineQtySummary(l: DsDraftLine): string {
  const base = lineQtyBase(l);
  if (l.buyMode === "BOX") {
    const upp = lineUnitsPerPresentation(l);
    return `${l.qty} caja(s) × ${upp} u./caja = ${base} u. al inventario`;
  }
  return `${l.qty} unidad(es) = ${base} u. al inventario`;
}

export function lineMoney(l: DsDraftLine) {
  const upp = lineUnitsPerPresentation(l);
  let unit = l.unitCost;
  let box = l.presentationCost;
  let subtotal = 0;
  if (l.costMode === "UNIT") {
    box = unit * upp;
    subtotal = unit * upp * l.qty;
  } else if (l.costMode === "PRESENTATION") {
    unit = upp > 0 ? box / upp : 0;
    subtotal = box * l.qty;
  } else {
    subtotal = l.lineTotal;
    box = l.qty > 0 ? subtotal / l.qty : 0;
    unit = upp > 0 ? box / upp : 0;
  }
  const tax = l.taxable ? subtotal * 0.16 : 0;
  return {
    unit,
    box,
    subtotal,
    tax,
    total: subtotal + tax,
    upp,
    qtyBase: lineQtyBase(l),
  };
}

export function draftPvpPreview(l: DsDraftLine, rateCtx: DsRateContext) {
  const m = lineMoney(l);
  const px = pricesFromCpp(
    m.unit,
    Math.max(1, l.unitsPerBox),
    l.utilityPercent,
  );
  const unitDisp = amountToDisplay(px.unitSale, rateCtx);
  const boxDisp = amountToDisplay(px.boxSale, rateCtx);
  const costUnitDisp = amountToDisplay(m.unit, rateCtx);
  return { m, px, unitDisp, boxDisp, costUnitDisp };
}

export function searchProducts(products: DsProduct[], term: string): DsProduct[] {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode ?? "").toLowerCase().includes(q),
  );
}

export function findProductByCode(
  products: DsProduct[],
  code: string,
): DsProduct | undefined {
  const q = code.trim().toLowerCase();
  if (!q) return undefined;
  return products.find(
    (p) =>
      (p.barcode ?? "").toLowerCase() === q || p.sku.toLowerCase() === q,
  );
}

export function formatDsNumber(n: number, decimals = 2): string {
  return n.toLocaleString("es-VE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
