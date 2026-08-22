/** Métodos de pago en Bs que requieren tasa propia de la factura. */
const BS_INVOICE_RATE_CODES = new Set([
  "efectivo_bs",
  "pago_movil",
  "transferencia",
  "tarjeta_debito_bs",
]);

const BS_INVOICE_RATE_NAME = /efectivo\s*bs|pago\s*m[oó]vil|transferencia|tarjeta\s*d[eé]bito\s*bs/i;

export type PaymentMethodLite = {
  name: string;
  currency: string;
  code?: string;
};

export function requiresInvoiceExchangeRate(method: PaymentMethodLite | undefined): boolean {
  if (!method) return false;
  if ((method.currency || "").toUpperCase() !== "BS") return false;
  const code = (method.code || "").toLowerCase();
  if (code && BS_INVOICE_RATE_CODES.has(code)) return true;
  return BS_INVOICE_RATE_NAME.test(method.name);
}

export function isBsCurrency(method: PaymentMethodLite | undefined): boolean {
  return (method?.currency || "").toUpperCase() === "BS";
}
