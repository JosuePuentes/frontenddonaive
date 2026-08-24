/** Desglose unidades → cajas + sueltas (misma idea que A&D inventario). */

export type StockBreakdown = {
  totalUnits: number;
  unitsPerBox: number;
  fullBoxes: number;
  looseUnits: number;
  hasBoxPack: boolean;
  canSellFullBox: boolean;
};

export function splitStockUnits(
  totalUnits: number,
  unitsPerBox: number,
): StockBreakdown {
  const total = Math.max(0, Math.floor(Number(totalUnits) || 0));
  const upb = Math.max(1, Math.floor(Number(unitsPerBox) || 1));
  if (upb <= 1) {
    return {
      totalUnits: total,
      unitsPerBox: 1,
      fullBoxes: 0,
      looseUnits: total,
      hasBoxPack: false,
      canSellFullBox: false,
    };
  }
  const fullBoxes = Math.floor(total / upb);
  const looseUnits = total % upb;
  return {
    totalUnits: total,
    unitsPerBox: upb,
    fullBoxes,
    looseUnits,
    hasBoxPack: true,
    canSellFullBox: fullBoxes >= 1,
  };
}
