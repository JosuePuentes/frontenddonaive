import { findUnitAndBox, pricesFromCost } from "@/lib/ad-licoreria/pack";
import { purchaseAmountToDisplay, type PurchaseRateContext } from "@/lib/ad-licoreria/rates";

export type DraftLine = {
  key: string;
  presentationId: string;
  unitPresentationId?: string;
  boxPresentationId?: string;
  productLabel: string;
  presentationLabel: string;
  unitsPerPresentation: number;
  boxUnits: number;
  buyMode: "UNIT" | "BOX";
  qty: number;
  qtyBonus: number;
  costMode: "UNIT" | "PRESENTATION" | "TOTAL";
  unitCost: number;
  presentationCost: number;
  lineTotal: number;
  taxable: boolean;
  utilityPercent: number;
};

export function hitToDraftLine(
  p: {
    sku?: string | null;
    name: string;
    taxable?: boolean;
    defaultUtilityPercent?: number;
    presentations: { id: string; name: string; unitsPerPresentation: number }[];
  },
  prefer: "UNIT" | "BOX",
): DraftLine | null {
  const pack = findUnitAndBox(p.presentations);
  const hasBox = Boolean(pack.box);
  const buyMode: "UNIT" | "BOX" = hasBox ? prefer : "UNIT";
  const chosen =
    buyMode === "BOX" && pack.box ? pack.box : pack.unit ?? p.presentations[0];
  if (!chosen) return null;
  return {
    key: `draft-${chosen.id}-${Date.now()}`,
    presentationId: chosen.id,
    unitPresentationId: pack.unit?.id,
    boxPresentationId: pack.box?.id,
    productLabel: `${p.sku ?? ""} ${p.name}`.trim(),
    presentationLabel: chosen.name,
    unitsPerPresentation: chosen.unitsPerPresentation || 1,
    boxUnits: pack.box?.unitsPerPresentation || chosen.unitsPerPresentation || 1,
    buyMode,
    qty: 1,
    qtyBonus: 0,
    costMode: buyMode === "BOX" ? "PRESENTATION" : "UNIT",
    unitCost: 0,
    presentationCost: 0,
    lineTotal: 0,
    taxable: Boolean(p.taxable),
    utilityPercent: Number(p.defaultUtilityPercent) || 0,
  };
}

/** Unidades base por presentación según modo caja/unidad de compra. */
export function lineUnitsPerPresentation(l: DraftLine): number {
  if (l.buyMode === "UNIT") return 1;
  return Math.max(1, l.boxUnits || l.unitsPerPresentation || 1);
}

export function lineQtyBase(l: DraftLine): number {
  return Math.max(0, l.qty) * lineUnitsPerPresentation(l);
}

export function formatLineQtySummary(l: DraftLine): string {
  const base = lineQtyBase(l);
  if (l.buyMode === "BOX") {
    const upp = lineUnitsPerPresentation(l);
    return `${l.qty} caja(s) × ${upp} u./caja = ${base} u. al inventario`;
  }
  return `${l.qty} unidad(es) suelta(s) = ${base} u. al inventario`;
}

/** Precio unitario en factura → costMode interno según cómo compró. */
export function invoiceUnitarioCostMode(
  buyMode: DraftLine["buyMode"],
): "UNIT" | "PRESENTATION" {
  return buyMode === "BOX" ? "PRESENTATION" : "UNIT";
}

export function normalizeDraftLineCostMode(line: DraftLine): DraftLine {
  if (line.costMode === "TOTAL") return line;
  const expected = invoiceUnitarioCostMode(line.buyMode);
  if (line.costMode === expected) return line;
  // Legacy: UNIT + BOX → tratar como unitario de caja (PRESENTATION)
  if (line.buyMode === "BOX" && line.costMode === "UNIT") {
    return {
      ...line,
      costMode: "PRESENTATION",
      presentationCost: line.unitCost * lineUnitsPerPresentation(line),
      unitCost: line.unitCost,
    };
  }
  return { ...line, costMode: expected };
}

export function lineMoney(l: DraftLine) {
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
  return { unit, box, subtotal, tax, total: subtotal + tax, upp, qtyBase: l.qty * upp };
}

export function lineToApiPayload(
  l: DraftLine,
  currency: "USD" | "BS",
  realUnit?: number,
  realLineTotal?: number,
) {
  const m = lineMoney(l);
  const unit = realUnit != null && realUnit > 0 ? realUnit : m.unit;
  const lineTotal =
    realLineTotal != null && realLineTotal > 0 ? realLineTotal : m.subtotal;
  const upp = lineUnitsPerPresentation(l);
  const box = unit * upp;
  return {
    presentationId: l.presentationId,
    qty: l.qty,
    qtyBonus: l.qtyBonus,
    costMode: l.costMode,
    unitCostUsd: currency === "USD" ? unit : 0,
    unitCostBs: currency === "BS" ? unit : 0,
    presentationCostUsd: currency === "USD" ? box : 0,
    presentationCostBs: currency === "BS" ? box : 0,
    lineTotalUsd: currency === "USD" ? lineTotal : 0,
    lineTotalBs: currency === "BS" ? lineTotal : 0,
    taxable: l.taxable,
  };
}

export function draftPvpPreview(
  l: DraftLine,
  rateCtx: PurchaseRateContext,
) {
  const m = lineMoney(l);
  const px = pricesFromCost(
    m.unit,
    Math.max(1, l.boxUnits || l.unitsPerPresentation),
    l.utilityPercent,
  );
  const unitDisp = purchaseAmountToDisplay(px.unitSale, rateCtx);
  const boxDisp = purchaseAmountToDisplay(px.boxSale, rateCtx);
  const costUnitDisp = purchaseAmountToDisplay(m.unit, rateCtx);
  return { m, px, unitDisp, boxDisp, costUnitDisp };
}

export { pricesFromCost, purchaseAmountToDisplay };
export type { PurchaseRateContext } from "@/lib/ad-licoreria/rates";
