/** Tasas y precios duales USD/Bs — misma lógica conceptual que A&D. */

export type DsMoney = { usd: number; bs: number };

export type DsRateContext = {
  currency: "USD" | "BS";
  bcv: number;
  protectedRate: number;
  useProtected: boolean;
  /** Tasa propia de factura cuando el pago es en Bs. */
  invoiceRate?: number;
};

export function completeDsPrice(price: DsMoney, bcv: number): DsMoney {
  let usd = Number(price.usd) || 0;
  let bs = Number(price.bs) || 0;
  const rate = Number(bcv) || 0;
  if (usd > 0 && !(bs > 0) && rate > 0) bs = usd * rate;
  if (bs > 0 && !(usd > 0) && rate > 0) usd = bs / rate;
  return { usd, bs };
}

export function hasDsMoney(price: DsMoney | undefined): boolean {
  if (!price) return false;
  return Number(price.usd) > 0 || Number(price.bs) > 0;
}

/** Monto en moneda de operación → USD (BCV) + Bs de referencia. */
export function amountToDisplay(amount: number, ctx: DsRateContext): DsMoney & {
  internalBs?: number;
} {
  const bcv = ctx.bcv > 0 ? ctx.bcv : 1;
  if (ctx.currency === "BS") {
    const rate =
      ctx.invoiceRate && ctx.invoiceRate > 0 ? ctx.invoiceRate : bcv;
    return { usd: amount / rate, bs: amount };
  }
  if (ctx.useProtected && ctx.protectedRate > 0) {
    const internalBs = amount * ctx.protectedRate;
    const usd = internalBs / bcv;
    return { usd, bs: usd * bcv, internalBs };
  }
  return { usd: amount, bs: amount * bcv };
}

export function formatDsMoney(price: DsMoney): string {
  const usd = new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price.usd);
  const bs = new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price.bs);
  return `$${usd} · Bs ${bs}`;
}
