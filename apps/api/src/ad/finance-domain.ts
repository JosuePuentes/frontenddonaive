/**
 * Dominio puro Fase 7 — finanzas, conversión explícita, reposición.
 * Sin I/O.
 */

export {
  equivalentUsdFromProtected,
  replacementCostFromRates,
  convertWithExplicitRate,
  fxConversionDifference,
} from "./commerce-domain.js";

/** Convierte con tasa Bs por 1 USD. Misma moneda = 1:1 sin inventar tasa. */
export function convertBetweenCurrencies(input: {
  amount: number;
  from: "USD" | "BS";
  to: "USD" | "BS";
  /** Obligatorio si from !== to. Unidades de Bs por 1 USD. */
  rateBsPerUsd?: number;
}): { amountOut: number; rateUsed: number | null } {
  const amount = Number(input.amount);
  if (!(amount > 0)) throw new Error("Monto inválido");
  if (input.from === input.to) {
    return { amountOut: amount, rateUsed: null };
  }
  const rate = Number(input.rateBsPerUsd ?? 0);
  if (!(rate > 0)) {
    throw new Error("Tasa explícita obligatoria para cambio de moneda");
  }
  if (input.from === "USD" && input.to === "BS") {
    return { amountOut: amount * rate, rateUsed: rate };
  }
  // BS → USD
  return { amountOut: amount / rate, rateUsed: rate };
}

export function isIncomeMovement(
  type: string,
): boolean {
  return type === "INGRESO_VENTA" || type === "AJUSTE";
}

/** Signo contable para la cuenta principal: + ingreso, − egreso/retiro/gasto. */
export function movementSignForAccount(
  type: string,
  role: "primary" | "counter",
): 1 | -1 {
  if (type === "TRANSFERENCIA" || type === "CAMBIO_MONEDA") {
    return role === "primary" ? -1 : 1;
  }
  if (
    type === "EGRESO_COMPRA" ||
    type === "EGRESO_GASTO" ||
    type === "RETIRO"
  ) {
    return -1;
  }
  if (type === "INGRESO_VENTA") return 1;
  // AJUSTE / OTROS: el monto puede ser positivo (suma) — el caller decide
  return 1;
}
