/**
 * Dominio puro Fase 5 — costos, bonificaciones, CPP, precios, reposición.
 * Sin I/O. Reutilizable por API y tests.
 */

export type CostMode = "UNIT" | "PRESENTATION" | "TOTAL";

export type PurchaseLineCostInput = {
  /** Presentaciones facturadas (pagadas). */
  qtyInvoiced: number;
  /** Presentaciones bonificadas. */
  qtyBonus?: number;
  unitsPerPresentation: number;
  costMode: CostMode;
  /** Costo por unidad base (modo UNIT). */
  unitCost?: number;
  /** Costo por presentación/caja (modo PRESENTATION). */
  presentationCost?: number;
  /** Costo total de línea facturado (modo TOTAL). */
  lineTotal?: number;
};

export type PurchaseLineCostResult = {
  qtyInvoiced: number;
  qtyBonus: number;
  qtyReceived: number;
  unitsPerPresentation: number;
  qtyInvoicedBase: number;
  qtyBonusBase: number;
  qtyReceivedBase: number;
  /** Monto de la factura (cuenta por pagar) — NO incluye bonificación. */
  invoicedTotal: number;
  unitCostInvoiced: number;
  presentationCostInvoiced: number;
  /** Costo efectivo post-bonificación (sobre cantidad recibida). */
  effectiveUnitCost: number;
  effectivePresentationCost: number;
  effectiveTotal: number;
};

export function resolvePurchaseLineCosts(
  input: PurchaseLineCostInput,
): PurchaseLineCostResult {
  const qtyInvoiced = Number(input.qtyInvoiced);
  const qtyBonus = Number(input.qtyBonus ?? 0);
  const upp = Number(input.unitsPerPresentation);
  if (!(qtyInvoiced > 0)) throw new Error("Cantidad facturada inválida");
  if (!(upp > 0)) throw new Error("Unidades por presentación inválidas");
  if (qtyBonus < 0) throw new Error("Bonificación inválida");

  const qtyReceived = qtyInvoiced + qtyBonus;
  const qtyInvoicedBase = qtyInvoiced * upp;
  const qtyBonusBase = qtyBonus * upp;
  const qtyReceivedBase = qtyReceived * upp;

  let presentationCostInvoiced = 0;
  let unitCostInvoiced = 0;
  let invoicedTotal = 0;

  if (input.costMode === "UNIT") {
    unitCostInvoiced = Number(input.unitCost ?? 0);
    if (!(unitCostInvoiced >= 0)) throw new Error("Costo unitario inválido");
    presentationCostInvoiced = unitCostInvoiced * upp;
    invoicedTotal = unitCostInvoiced * qtyInvoicedBase;
  } else if (input.costMode === "PRESENTATION") {
    presentationCostInvoiced = Number(input.presentationCost ?? 0);
    if (!(presentationCostInvoiced >= 0)) {
      throw new Error("Costo por presentación inválido");
    }
    unitCostInvoiced = presentationCostInvoiced / upp;
    invoicedTotal = presentationCostInvoiced * qtyInvoiced;
  } else {
    invoicedTotal = Number(input.lineTotal ?? 0);
    if (!(invoicedTotal >= 0)) throw new Error("Costo total inválido");
    presentationCostInvoiced = invoicedTotal / qtyInvoiced;
    unitCostInvoiced = presentationCostInvoiced / upp;
  }

  const effectiveUnitCost =
    qtyReceivedBase > 0 ? invoicedTotal / qtyReceivedBase : unitCostInvoiced;
  const effectivePresentationCost = effectiveUnitCost * upp;

  return {
    qtyInvoiced,
    qtyBonus,
    qtyReceived,
    unitsPerPresentation: upp,
    qtyInvoicedBase,
    qtyBonusBase,
    qtyReceivedBase,
    invoicedTotal,
    unitCostInvoiced,
    presentationCostInvoiced,
    effectiveUnitCost,
    effectivePresentationCost,
    effectiveTotal: invoicedTotal,
  };
}

/** IVA Venezuela compras — tasa por defecto 16%. */
export const AD_DEFAULT_TAX_RATE = 0.16;

export function applyLineTax(
  lineSubtotal: number,
  taxable: boolean,
  taxRate = AD_DEFAULT_TAX_RATE,
): { subtotal: number; tax: number; totalWithTax: number; taxRate: number } {
  const subtotal = Number(lineSubtotal);
  if (!(subtotal >= 0)) throw new Error("Subtotal inválido");
  const rate = taxable ? Number(taxRate) : 0;
  if (rate < 0 || rate > 1) throw new Error("Tasa IVA inválida");
  const tax = taxable ? subtotal * rate : 0;
  return {
    subtotal,
    tax,
    totalWithTax: subtotal + tax,
    taxRate: rate,
  };
}

export type PurchaseTotalsLine = {
  subtotal: number;
  tax: number;
  totalWithTax: number;
};

/** Suma subtotal / IVA / total general de líneas. */
export function sumPurchaseDocumentTotals(lines: PurchaseTotalsLine[]): {
  subtotal: number;
  tax: number;
  grandTotal: number;
} {
  let subtotal = 0;
  let tax = 0;
  for (const l of lines) {
    subtotal += Number(l.subtotal);
    tax += Number(l.tax);
  }
  return { subtotal, tax, grandTotal: subtotal + tax };
}

/** Redondeo monetario solo para presentación (no usar en CPP interno). */
export function roundMoney(value: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * f) / f;
}

/** Costo equivalente USD cuando la compra se pagó vía tasa protegida → Bs → BCV. */
export function equivalentUsdFromProtected(
  amountUsd: number,
  protectedRate: number,
  bcvRate: number,
): number {
  if (!(protectedRate > 0) || !(bcvRate > 0)) return amountUsd;
  const bs = amountUsd * protectedRate;
  return bs / bcvRate;
}

export function equivalentBsFromUsd(amountUsd: number, rate: number): number {
  if (!(rate > 0)) return 0;
  return amountUsd * rate;
}

export type PriceFromUtilityInput = {
  cost: number;
  utilityPercent: number;
};

export function priceFromUtility(input: PriceFromUtilityInput): {
  price: number;
  utilityAmount: number;
  utilityPercent: number;
  marginPercent: number;
} {
  const cost = Number(input.cost);
  const utilityPercent = Number(input.utilityPercent);
  if (!(cost >= 0)) throw new Error("Costo inválido");
  const price = cost * (1 + utilityPercent / 100);
  const utilityAmount = price - cost;
  const marginPercent = price > 0 ? (utilityAmount / price) * 100 : 0;
  return { price, utilityAmount, utilityPercent, marginPercent };
}

export function utilityFromPrice(cost: number, price: number): {
  price: number;
  utilityAmount: number;
  utilityPercent: number;
  marginPercent: number;
  belowCost: boolean;
} {
  const c = Number(cost);
  const p = Number(price);
  const utilityAmount = p - c;
  const utilityPercent = c > 0 ? (utilityAmount / c) * 100 : 0;
  const marginPercent = p > 0 ? (utilityAmount / p) * 100 : 0;
  return {
    price: p,
    utilityAmount,
    utilityPercent,
    marginPercent,
    belowCost: p < c,
  };
}

export type ReplenishmentInput = {
  /** Consumo promedio diario (unidad base). */
  avgDailyConsumption: number;
  stockAvailable: number;
  coverageDays: number;
};

export function suggestReplenishment(input: ReplenishmentInput): {
  need: number;
  suggested: number;
  coverageDays: number;
  estimatedCoverageDays: number;
} {
  const daily = Math.max(0, Number(input.avgDailyConsumption));
  const stock = Math.max(0, Number(input.stockAvailable));
  const days = Math.max(0, Number(input.coverageDays));
  const need = daily * days;
  const suggested = Math.max(0, need - stock);
  const estimatedCoverageDays = daily > 0 ? stock / daily : Infinity;
  return {
    need,
    suggested,
    coverageDays: days,
    estimatedCoverageDays,
  };
}

/** Promedio simple diario a partir de consumo en una ventana. */
export function avgDailyFromWindow(
  qtyConsumedBase: number,
  windowDays: number,
): number {
  const days = Math.max(1, Number(windowDays));
  return Math.max(0, Number(qtyConsumedBase)) / days;
}
