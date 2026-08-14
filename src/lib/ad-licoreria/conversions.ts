import type { AdPresentation, AdPrice } from "@/types/ad-licoreria";

/** Convierte cantidad de presentación → unidades base. */
export function toBaseUnits(
  presentation: Pick<AdPresentation, "unitsPerPresentation">,
  qtyPresentation: number,
): number {
  return qtyPresentation * presentation.unitsPerPresentation;
}

/** Convierte unidades base → cantidad de presentación (puede ser fraccional). */
export function fromBaseUnits(
  presentation: Pick<AdPresentation, "unitsPerPresentation">,
  qtyBase: number,
): number {
  if (presentation.unitsPerPresentation <= 0) return 0;
  return qtyBase / presentation.unitsPerPresentation;
}

export function formatAdPrice(price: AdPrice): string {
  return `$${price.usd.toFixed(2)} · Bs ${price.bs.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function multiplyPrice(price: AdPrice, qty: number): AdPrice {
  return {
    usd: Number((price.usd * qty).toFixed(2)),
    bs: Number((price.bs * qty).toFixed(2)),
  };
}

export function addPrices(...prices: AdPrice[]): AdPrice {
  return prices.reduce(
    (acc, p) => ({
      usd: Number((acc.usd + p.usd).toFixed(2)),
      bs: Number((acc.bs + p.bs).toFixed(2)),
    }),
    { usd: 0, bs: 0 },
  );
}

/** Disponibles en presentación = pagadas − servidas. */
export function accountAvailable(qtyPaid: number, qtyServed: number): number {
  return Math.max(0, qtyPaid - qtyServed);
}
