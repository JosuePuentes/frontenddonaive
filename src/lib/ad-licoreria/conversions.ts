import type { AdAppSettings, AdPresentation, AdPrice } from "@/types/ad-licoreria";

/** Convierte cantidad de presentación → unidades base (conversión configurable). */
export function toBaseUnits(
  presentation: Pick<AdPresentation, "unitsPerPresentation">,
  qtyPresentation: number,
): number {
  return qtyPresentation * presentation.unitsPerPresentation;
}

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

export function accountAvailable(qty: number, qtyServed: number): number {
  return Math.max(0, qty - qtyServed);
}

export function prepaidAvailable(purchased: number, consumed: number): number {
  return Math.max(0, purchased - consumed);
}

/** Solo sugerencia: el precio Bs sigue siendo editable y no se fuerza. */
export function suggestBsFromUsd(
  usd: number,
  settings: Pick<AdAppSettings, "exchangeRateUsdToBs">,
): number {
  return Number((usd * settings.exchangeRateUsdToBs).toFixed(2));
}

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nextAccountNumber(seq: number): string {
  return String(seq).padStart(6, "0");
}

export function nextPrepaidCode(seq: number): string {
  const year = new Date().getFullYear();
  return `A&D-${year}-${String(seq).padStart(6, "0")}`;
}
