/**
 * Costo promedio ponderado (CPP) — misma idea que A&D al confirmar compras.
 * Nuevo CPP = (stock × CPP_actual + entrada × costo) / (stock + entrada)
 */

export type CppState = {
  qtyBase: number;
  unitCostUsd: number;
};

export function applyWeightedCpp(
  current: CppState,
  incomingQty: number,
  incomingUnitCostUsd: number,
): CppState {
  const stock = Math.max(0, Number(current.qtyBase) || 0);
  const cost = Math.max(0, Number(current.unitCostUsd) || 0);
  const inQty = Math.max(0, Number(incomingQty) || 0);
  const inCost = Math.max(0, Number(incomingUnitCostUsd) || 0);
  if (inQty <= 0) return { qtyBase: stock, unitCostUsd: cost };
  const totalQty = stock + inQty;
  if (totalQty <= 0) return { qtyBase: 0, unitCostUsd: 0 };
  const unitCostUsd =
    stock <= 0 ? inCost : (stock * cost + inQty * inCost) / totalQty;
  return { qtyBase: totalQty, unitCostUsd };
}

/** Margen contable % sobre PVP (no markup lineal sobre costo). */
export function pricesFromCpp(
  unitCostUsd: number,
  unitsPerBox: number,
  utilityPercent: number,
) {
  const margin = Math.max(0, Math.min(99.99, Number(utilityPercent) || 0));
  const unit = Math.max(0, Number(unitCostUsd) || 0);
  const upp = Math.max(1, Number(unitsPerBox) || 1);
  const boxCost = unit * upp;
  const factor = margin <= 0 ? 1 : 1 / (1 - margin / 100);
  return {
    unitCost: unit,
    boxCost,
    unitSale: unit * factor,
    boxSale: boxCost * factor,
    utilityPercent: margin,
  };
}
