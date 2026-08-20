/** Caja vs unidad: conversión y PVP a partir de costo + utilidad de ficha. */

export type PackMode = "UNIT" | "BOX";

export function findUnitAndBox<
  T extends { unitsPerPresentation: number; name?: string | null },
>(presentations: T[]): { unit: T | undefined; box: T | undefined } {
  const sorted = [...presentations].sort(
    (a, b) => a.unitsPerPresentation - b.unitsPerPresentation,
  );
  const unit =
    sorted.find((p) => p.unitsPerPresentation === 1) ?? sorted[0];
  const box = [...presentations]
    .filter((p) => p.unitsPerPresentation > 1)
    .sort((a, b) => b.unitsPerPresentation - a.unitsPerPresentation)[0];
  return { unit, box };
}

/** PVP unidad y caja: utilidad contable % (margen sobre precio de venta). */
export function pricesFromCost(
  unitCost: number,
  unitsPerBox: number,
  utilityPercent: number,
) {
  const margin = Math.max(0, Math.min(99.99, Number(utilityPercent) || 0));
  const unit = Math.max(0, Number(unitCost) || 0);
  const upp = Math.max(1, Number(unitsPerBox) || 1);
  const boxCost = unit * upp;
  const factor = margin <= 0 ? 1 : 1 / (1 - margin / 100);
  return {
    unitCost: unit,
    boxCost,
    unitSale: unit * factor,
    boxSale: boxCost * factor,
    utilityPercent: margin,
    unitsPerBox: upp,
  };
}
