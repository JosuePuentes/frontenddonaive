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

export function lineMoney(l: DraftLine) {
  const upp = l.unitsPerPresentation || 1;
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
  return { unit, box, subtotal, tax, total: subtotal + tax, upp };
}

export function lineToApiPayload(l: DraftLine, currency: "USD" | "BS") {
  const m = lineMoney(l);
  return {
    presentationId: l.presentationId,
    qty: l.qty,
    qtyBonus: l.qtyBonus,
    costMode: l.costMode,
    unitCostUsd: currency === "USD" ? m.unit : 0,
    unitCostBs: currency === "BS" ? m.unit : 0,
    presentationCostUsd: currency === "USD" ? m.box : 0,
    presentationCostBs: currency === "BS" ? m.box : 0,
    lineTotalUsd: currency === "USD" ? m.subtotal : 0,
    lineTotalBs: currency === "BS" ? m.subtotal : 0,
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
