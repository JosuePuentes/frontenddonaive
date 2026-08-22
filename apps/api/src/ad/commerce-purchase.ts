/**
 * Helpers F6 — construcción de líneas de compra + totales IVA.
 */
import { Prisma } from "@prisma/client";
import {
  AD_DEFAULT_TAX_RATE,
  applyLineTax,
  completeCrossCurrencyAmount,
  equivalentUsdFromProtected,
  resolvePurchaseLineCosts,
  scalePurchaseCosts,
  sumPurchaseDocumentTotals,
  type CostMode,
} from "./commerce-domain.js";

function num(v: Prisma.Decimal | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

function dec(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n);
}

export type RawPurchaseLineInput = {
  presentationId: string;
  qty: number;
  qtyBonus?: number;
  costMode: CostMode;
  unitCostUsd?: number;
  unitCostBs?: number;
  presentationCostUsd?: number;
  presentationCostBs?: number;
  lineTotalUsd?: number;
  lineTotalBs?: number;
  taxable?: boolean;
  taxRate?: number;
};

export type BuiltPurchaseLine = {
  productId: string;
  presentationId: string;
  data: Prisma.AdPurchaseLineUncheckedCreateWithoutPurchaseInput;
  subtotalUsd: number;
  taxUsd: number;
  totalWithTaxUsd: number;
  subtotalBs: number;
  taxBs: number;
  totalWithTaxBs: number;
  effectiveTotalUsd: number;
  effectiveTotalBs: number;
};

export function buildPurchaseLineFromPresentation(
  presentation: {
    id: string;
    productId: string;
    unitsPerPresentation: Prisma.Decimal | number;
    product: { tenantId: string; taxable?: boolean };
  },
  raw: RawPurchaseLineInput,
  opts?: {
    tenantId: string;
    useProtected?: boolean;
    protectedRate?: number | null;
    bcv?: number | null;
    currency?: "USD" | "BS";
  },
): BuiltPurchaseLine {
  if (opts?.tenantId && presentation.product.tenantId !== opts.tenantId) {
    throw new Error("Presentación fuera del tenant");
  }
  const upp = num(presentation.unitsPerPresentation);
  const costsUsdRaw = resolvePurchaseLineCosts({
    qtyInvoiced: raw.qty,
    qtyBonus: raw.qtyBonus,
    unitsPerPresentation: upp,
    costMode: raw.costMode,
    unitCost: raw.unitCostUsd,
    presentationCost: raw.presentationCostUsd,
    lineTotal: raw.lineTotalUsd,
  });
  const costsBsRaw = resolvePurchaseLineCosts({
    qtyInvoiced: raw.qty,
    qtyBonus: raw.qtyBonus,
    unitsPerPresentation: upp,
    costMode: raw.costMode,
    unitCost: raw.unitCostBs ?? 0,
    presentationCost: raw.presentationCostBs ?? 0,
    lineTotal: raw.lineTotalBs ?? 0,
  });

  const bcv = opts?.bcv && opts.bcv > 0 ? opts.bcv : 0;
  const prot =
    opts?.useProtected && opts.protectedRate && opts.protectedRate > 0
      ? opts.protectedRate
      : 0;
  let costsUsd = costsUsdRaw;
  let costsBs = costsBsRaw;
  if (opts?.currency === "BS" && costsBs.invoicedTotal > 0 && !(costsUsd.invoicedTotal > 0) && bcv > 0) {
    costsUsd = scalePurchaseCosts(costsBs, 1 / bcv);
  }
  if (opts?.currency === "USD" && costsUsd.invoicedTotal > 0 && !(costsBs.invoicedTotal > 0)) {
    const rate = prot > 0 ? prot : bcv;
    if (rate > 0) costsBs = scalePurchaseCosts(costsUsd, rate);
  }

  const taxable =
    raw.taxable ?? Boolean(presentation.product.taxable) ?? false;
  const taxRate = raw.taxRate ?? AD_DEFAULT_TAX_RATE;
  const taxUsd = applyLineTax(costsUsd.invoicedTotal, taxable, taxRate);
  const taxBs = applyLineTax(costsBs.invoicedTotal, taxable, taxRate);

  let equivalentUsd: number | null = null;
  let equivalentBs: number | null = null;
  if (opts?.useProtected && prot > 0 && bcv > 0) {
    if (opts.currency === "BS") {
      equivalentBs = costsBs.invoicedTotal;
      equivalentUsd = costsBs.invoicedTotal / bcv;
    } else {
      equivalentUsd = equivalentUsdFromProtected(
        costsUsd.invoicedTotal,
        prot,
        bcv,
      );
      equivalentBs = costsUsd.invoicedTotal * prot;
    }
  } else if (bcv > 0) {
    const pair = completeCrossCurrencyAmount({
      amountUsd: costsUsd.invoicedTotal,
      amountBs: costsBs.invoicedTotal,
      bcv,
    });
    equivalentUsd = pair.usd;
    equivalentBs = pair.bs;
  }

  return {
    productId: presentation.productId,
    presentationId: presentation.id,
    subtotalUsd: taxUsd.subtotal,
    taxUsd: taxUsd.tax,
    totalWithTaxUsd: taxUsd.totalWithTax,
    subtotalBs: taxBs.subtotal,
    taxBs: taxBs.tax,
    totalWithTaxBs: taxBs.totalWithTax,
    effectiveTotalUsd: costsUsd.effectiveTotal,
    effectiveTotalBs: costsBs.effectiveTotal,
    data: {
      productId: presentation.productId,
      presentationId: presentation.id,
      qty: dec(costsUsd.qtyInvoiced),
      qtyBase: dec(costsUsd.qtyInvoicedBase),
      qtyBonus: dec(costsUsd.qtyBonus),
      qtyBonusBase: dec(costsUsd.qtyBonusBase),
      qtyReceivedBase: dec(costsUsd.qtyReceivedBase),
      costMode: raw.costMode,
      unitCostUsd: dec(costsUsd.unitCostInvoiced),
      unitCostBs: dec(costsBs.unitCostInvoiced),
      presentationCostUsd: dec(costsUsd.presentationCostInvoiced),
      presentationCostBs: dec(costsBs.presentationCostInvoiced),
      lineCostUsd: dec(costsUsd.invoicedTotal),
      lineCostBs: dec(costsBs.invoicedTotal),
      effectiveUnitCostUsd: dec(costsUsd.effectiveUnitCost),
      effectiveUnitCostBs: dec(costsBs.effectiveUnitCost),
      effectivePresentationCostUsd: dec(costsUsd.effectivePresentationCost),
      effectivePresentationCostBs: dec(costsBs.effectivePresentationCost),
      equivalentCostUsd: equivalentUsd != null ? dec(equivalentUsd) : undefined,
      equivalentCostBs: equivalentBs != null ? dec(equivalentBs) : undefined,
      taxable,
      taxRate: dec(taxRate),
      lineTaxUsd: dec(taxUsd.tax),
      lineTaxBs: dec(taxBs.tax),
      lineTotalWithTaxUsd: dec(taxUsd.totalWithTax),
      lineTotalWithTaxBs: dec(taxBs.totalWithTax),
    },
  };
}

export function aggregateBuiltLines(lines: BuiltPurchaseLine[]) {
  const usd = sumPurchaseDocumentTotals(
    lines.map((l) => ({
      subtotal: l.subtotalUsd,
      tax: l.taxUsd,
      totalWithTax: l.totalWithTaxUsd,
    })),
  );
  const bs = sumPurchaseDocumentTotals(
    lines.map((l) => ({
      subtotal: l.subtotalBs,
      tax: l.taxBs,
      totalWithTax: l.totalWithTaxBs,
    })),
  );
  const totalEffectiveUsd = lines.reduce((a, l) => a + l.effectiveTotalUsd, 0);
  const totalEffectiveBs = lines.reduce((a, l) => a + l.effectiveTotalBs, 0);
  return {
    subtotalUsd: usd.subtotal,
    taxUsd: usd.tax,
    grandTotalUsd: usd.grandTotal,
    subtotalBs: bs.subtotal,
    taxBs: bs.tax,
    grandTotalBs: bs.grandTotal,
    /** Subtotal mercancía facturada (sin IVA) — compat F5 totalInvoiced */
    totalInvoicedUsd: usd.subtotal,
    totalInvoicedBs: bs.subtotal,
    totalEffectiveUsd,
    totalEffectiveBs,
  };
}

export function moneyDoc(purchase: {
  subtotalUsd: Prisma.Decimal | number;
  taxUsd: Prisma.Decimal | number;
  grandTotalUsd: Prisma.Decimal | number;
  subtotalBs: Prisma.Decimal | number;
  taxBs: Prisma.Decimal | number;
  grandTotalBs: Prisma.Decimal | number;
  currency: string;
  lines: Array<Record<string, unknown>>;
  supplierName: string;
  invoiceNumber: string;
  warehouseId: string;
  paymentCondition: string;
  creditDays: number | null;
  dueDate: Date | null;
  paymentMethodId: string | null;
  paymentMethod?: { name: string; currency: string } | null;
  warehouse?: { name: string; code: string } | null;
  status: string;
  id: string;
  notes: string | null;
  invoiceDate: Date | null;
}) {
  const cur = purchase.currency === "BS" ? "Bs" : "USD";
  const pick = (usd: unknown, bs: unknown) =>
    num((cur === "Bs" ? bs : usd) as Prisma.Decimal);
  return {
    id: purchase.id,
    status: purchase.status,
    supplierName: purchase.supplierName,
    invoiceNumber: purchase.invoiceNumber,
    warehouseId: purchase.warehouseId,
    warehouseName: purchase.warehouse?.name ?? null,
    currency: purchase.currency,
    paymentCondition: purchase.paymentCondition,
    creditDays: purchase.creditDays,
    dueDate: purchase.dueDate,
    paymentMethodId: purchase.paymentMethodId,
    paymentMethodName: purchase.paymentMethod?.name ?? null,
    invoiceDate: purchase.invoiceDate,
    notes: purchase.notes,
    /** Documento imprimible — sin utilidad/margen/PVP/tasa protegida. */
    document: {
      title:
        purchase.status === "RECEIVED"
          ? "COMPRA CONFIRMADA"
          : "COMPRA PRELIMINAR",
      supplierName: purchase.supplierName,
      invoiceNumber: purchase.invoiceNumber,
      invoiceDate: purchase.invoiceDate,
      warehouseName: purchase.warehouse?.name ?? purchase.warehouseId,
      paymentMethodName: purchase.paymentMethod?.name ?? "—",
      currency: purchase.currency,
      paymentCondition: purchase.paymentCondition,
      creditDays: purchase.creditDays,
      dueDate: purchase.dueDate,
      notes: purchase.notes,
      subtotal: pick(purchase.subtotalUsd, purchase.subtotalBs),
      tax: pick(purchase.taxUsd, purchase.taxBs),
      taxLabel: "IVA 16%",
      grandTotal: pick(purchase.grandTotalUsd, purchase.grandTotalBs),
      lines: purchase.lines.map((l) => {
        const product = l.product as
          | { sku?: string | null; name?: string; brand?: string | null }
          | undefined;
        const presentation = l.presentation as
          | { name?: string; unitsPerPresentation?: Prisma.Decimal | number }
          | undefined;
        return {
          code: product?.sku ?? "",
          description: product?.name ?? "",
          brand: product?.brand ?? "",
          presentation: presentation?.name ?? "",
          unitsPerPresentation: num(presentation?.unitsPerPresentation),
          qty: num(l.qty as Prisma.Decimal),
          qtyBonus: num(l.qtyBonus as Prisma.Decimal),
          unitCost: pick(l.unitCostUsd, l.unitCostBs),
          presentationCost: pick(l.presentationCostUsd, l.presentationCostBs),
          lineSubtotal: pick(l.lineCostUsd, l.lineCostBs),
          taxable: Boolean(l.taxable),
          lineTax: pick(l.lineTaxUsd, l.lineTaxBs),
          lineTotal: pick(l.lineTotalWithTaxUsd, l.lineTotalWithTaxBs),
        };
      }),
    },
  };
}
