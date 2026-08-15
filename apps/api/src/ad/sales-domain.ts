import { ValidationError } from "../errors/app-error.js";

export type PresentationPrice = {
  id: string;
  productId: string;
  unitsPerPresentation: number;
  priceUsd: number;
  priceBs: number;
  active: boolean;
};

export type SaleLineInput = {
  presentationId: string;
  qty: number;
  /** Si se envían, se validan; el snapshot siempre sale del catálogo en create sale F1. */
  overridePriceUsd?: number;
  overridePriceBs?: number;
};

export type SaleLineSnapshot = {
  productId: string;
  presentationId: string;
  qty: number;
  qtyBase: number;
  unitPriceUsd: number;
  unitPriceBs: number;
  lineTotalUsd: number;
  lineTotalBs: number;
};

/**
 * Construye líneas de venta con SNAPSHOT de precio.
 * USD y Bs son independientes — no hay conversión automática.
 */
export function buildSaleLineSnapshots(
  lines: SaleLineInput[],
  presentations: Map<string, PresentationPrice>,
  options?: { allowPriceOverride?: boolean },
): SaleLineSnapshot[] {
  if (!lines.length) {
    throw new ValidationError("La venta requiere al menos una línea");
  }

  return lines.map((line) => {
    if (!(line.qty > 0)) {
      throw new ValidationError("Cantidad de línea inválida");
    }
    const presentation = presentations.get(line.presentationId);
    if (!presentation || !presentation.active) {
      throw new ValidationError(
        `Presentación no disponible: ${line.presentationId}`,
      );
    }

    let unitPriceUsd = presentation.priceUsd;
    let unitPriceBs = presentation.priceBs;

    if (options?.allowPriceOverride) {
      if (line.overridePriceUsd !== undefined) {
        unitPriceUsd = line.overridePriceUsd;
      }
      if (line.overridePriceBs !== undefined) {
        unitPriceBs = line.overridePriceBs;
      }
    }

    const qtyBase = line.qty * presentation.unitsPerPresentation;

    return {
      productId: presentation.productId,
      presentationId: presentation.id,
      qty: line.qty,
      qtyBase,
      unitPriceUsd,
      unitPriceBs,
      lineTotalUsd: unitPriceUsd * line.qty,
      lineTotalBs: unitPriceBs * line.qty,
    };
  });
}

export function sumSaleTotals(lines: SaleLineSnapshot[]): {
  totalUsd: number;
  totalBs: number;
} {
  return lines.reduce(
    (acc, line) => ({
      totalUsd: acc.totalUsd + line.lineTotalUsd,
      totalBs: acc.totalBs + line.lineTotalBs,
    }),
    { totalUsd: 0, totalBs: 0 },
  );
}
