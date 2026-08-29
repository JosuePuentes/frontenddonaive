/** Descompone existencias en unidades base → cajas completas + unidades sueltas. */

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

/** Texto legible: "30 u. (0 cajas · 30 sueltas)" */
export function formatStockBreakdown(
  totalUnits: number,
  unitsPerBox: number,
): string {
  const s = splitStockUnits(totalUnits, unitsPerBox);
  if (!s.hasBoxPack) return `${s.totalUnits} u.`;
  if (s.fullBoxes === 0) {
    return `${s.totalUnits} u. (0 cajas · ${s.looseUnits} sueltas)`;
  }
  if (s.looseUnits === 0) {
    return `${s.totalUnits} u. (${s.fullBoxes} caja${s.fullBoxes === 1 ? "" : "s"} completa${s.fullBoxes === 1 ? "" : "s"})`;
  }
  return `${s.totalUnits} u. (${s.fullBoxes} caja${s.fullBoxes === 1 ? "" : "s"} + ${s.looseUnits} suelta${s.looseUnits === 1 ? "" : "s"})`;
}

/** Hint corto para venta: ¿alcanza caja completa? */
export function stockBoxHint(totalUnits: number, unitsPerBox: number): string | null {
  const s = splitStockUnits(totalUnits, unitsPerBox);
  if (!s.hasBoxPack) return null;
  if (!s.canSellFullBox) {
    return `Solo venta por unidad (${s.looseUnits} u.; faltan ${s.unitsPerBox - s.looseUnits} u. para 1 caja)`;
  }
  if (s.looseUnits > 0) {
    return `Venta por caja: ${s.fullBoxes} disponible(s) · sueltas: ${s.looseUnits} u.`;
  }
  return null;
}
