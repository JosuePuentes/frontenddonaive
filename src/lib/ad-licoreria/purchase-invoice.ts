import { lineMoney, type DraftLine } from "@/lib/ad-licoreria/purchase-draft";

export type ExtraInvoiceTax = {
  id: string;
  name: string;
  /** Monto en Bs (siempre en bolívares). */
  amountBs: number;
  /** Repartir entre líneas según subtotal para sumar al costo real. */
  allocateToCost: boolean;
};

export type LineRealCost = {
  subtotal: number;
  tax: number;
  allocatedExtraTax: number;
  realTotal: number;
  realUnit: number;
  realBox: number;
  qtyBase: number;
};

export type InvoiceTotals = {
  subtotal: number;
  tax: number;
  extraTaxesTotal: number;
  extraTaxesTotalBs: number;
  extraTaxesAllocated: number;
  grandTotal: number;
  lineRealCosts: Map<string, LineRealCost>;
};

const IVA_RATE = 0.16;

export function computeLineRealCosts(
  lines: DraftLine[],
  extraTaxes: ExtraInvoiceTax[],
  opts?: { currency?: "USD" | "BS"; invoiceRate?: number; bcv?: number },
): InvoiceTotals {
  const currency = opts?.currency ?? "BS";
  const rate =
    opts?.invoiceRate && opts.invoiceRate > 0
      ? opts.invoiceRate
      : opts?.bcv && opts.bcv > 0
        ? opts.bcv
        : 1;

  const extraTaxesInInvoiceCurrency = extraTaxes.map((t) => {
    const bs = Math.max(0, Number(t.amountBs) || 0);
    const amount =
      currency === "BS" ? bs : rate > 0 ? bs / rate : bs;
    return { ...t, amountInvoice: amount };
  });

  let subtotal = 0;
  let tax = 0;
  const lineBase = new Map<string, ReturnType<typeof lineMoney>>();

  for (const l of lines) {
    const m = lineMoney(l);
    lineBase.set(l.key, m);
    subtotal += m.subtotal;
    tax += m.tax;
  }

  const extraTaxesTotal = extraTaxesInInvoiceCurrency.reduce(
    (acc, t) => acc + t.amountInvoice,
    0,
  );
  const extraTaxesTotalBs = extraTaxes.reduce(
    (acc, t) => acc + Math.max(0, Number(t.amountBs) || 0),
    0,
  );
  const extraTaxesAllocated = extraTaxesInInvoiceCurrency
    .filter((t) => t.allocateToCost)
    .reduce((acc, t) => acc + t.amountInvoice, 0);

  const lineRealCosts = new Map<string, LineRealCost>();
  for (const l of lines) {
    const m = lineBase.get(l.key)!;
    const share = subtotal > 0 ? m.subtotal / subtotal : 0;
    const allocatedExtraTax = extraTaxesAllocated * share;
    const realTotal = m.subtotal + m.tax + allocatedExtraTax;
    const qtyBase = Math.max(
      0.0001,
      l.qty * (l.unitsPerPresentation || 1),
    );
    const realUnit = realTotal / qtyBase;
    const realBox = realUnit * (l.unitsPerPresentation || 1);
    lineRealCosts.set(l.key, {
      subtotal: m.subtotal,
      tax: m.tax,
      allocatedExtraTax,
      realTotal,
      realUnit,
      realBox,
      qtyBase,
    });
  }

  return {
    subtotal,
    tax,
    extraTaxesTotal,
    extraTaxesTotalBs,
    extraTaxesAllocated,
    grandTotal: subtotal + tax + extraTaxesTotal,
    lineRealCosts,
  };
}

export function newExtraTax(name = ""): ExtraInvoiceTax {
  return {
    id: `tax-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    amountBs: 0,
    allocateToCost: true,
  };
}

export { IVA_RATE };
