/** Conversión de montos de compra según tasa BCV o protegida (solo lógica interna). */

export function equivalentUsdFromProtected(
  amountUsd: number,
  protectedRate: number,
  bcvRate: number,
): number {
  if (!(protectedRate > 0) || !(bcvRate > 0)) return amountUsd;
  return (amountUsd * protectedRate) / bcvRate;
}

export type PurchaseRateContext = {
  currency: "USD" | "BS";
  bcv: number;
  protectedRate: number;
  useProtected: boolean;
};

/** Completa USD (BCV) y Bs para mostrar en POS. */
export function completeAdPrice(
  price: { usd: number; bs: number },
  bcv: number,
): { usd: number; bs: number } {
  let usd = Number(price.usd) || 0;
  let bs = Number(price.bs) || 0;
  const rate = Number(bcv) || 0;
  if (usd > 0 && !(bs > 0) && rate > 0) bs = usd * rate;
  if (bs > 0 && !(usd > 0) && rate > 0) usd = bs / rate;
  return { usd, bs };
}

/** Monto en moneda de factura → USD (BCV) + Bs de venta (BCV). */
export function purchaseAmountToDisplay(
  amount: number,
  ctx: PurchaseRateContext,
): { usd: number; bs: number; internalBs?: number } {
  const bcv = ctx.bcv > 0 ? ctx.bcv : 1;
  if (ctx.currency === "BS") {
    const usd = amount / bcv;
    return { usd, bs: amount };
  }
  if (ctx.useProtected && ctx.protectedRate > 0) {
    const internalBs = amount * ctx.protectedRate;
    const usd = internalBs / bcv;
    return { usd, bs: usd * bcv, internalBs };
  }
  return { usd: amount, bs: amount * bcv };
}
