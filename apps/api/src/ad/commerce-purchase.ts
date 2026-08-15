/**
 * Helpers F6 — construcción de líneas de compra + totales IVA.
 */
import { Prisma } from "@prisma/client";
import {
  AD_DEFAULT_TAX_RATE,
  applyLineTax,
  equivalentUsdFromProtected,
  resolvePurchaseLineCosts,
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
  const costsUsd = resolvePurchaseLineCosts({
    qtyInvoiced: raw.qty,
    qtyBonus: raw.qtyBonus,
    unitsPerPresentation: upp,
    costMode: raw.costMode,
    unitCost: raw.unitCostUsd,
    presentationCost: raw.presentationCostUsd,
    lineTotal: raw.lineTotalUsd,
  });
  const costsBs = resolvePurchaseLineCosts({
    qtyInvoiced: raw.qty,
    qtyBonus: raw.qtyBonus,
    unitsPerPresentation: upp,
    costMode: raw.costMode,
    unitCost: raw.unitCostBs ?? 0,
    presentationCost: raw.presentationCostBs ?? 0,
    lineTotal: raw.lineTotalBs ?? 0,
  });

  const taxable =
    raw.taxable ?? Boolean(presentation.product.taxable) ?? false;
  const taxRate = raw.taxRate ?? AD_DEFAULT_TAX_RATE;
  const taxUsd = applyLineTax(costsUsd.invoicedTotal, taxable, taxRate);
  const taxBs = applyLineTax(costsBs.invoicedTotal, taxable, taxRate);

  let equivalentUsd: number | null = null;
  let equivalentBs: number | null = null;
  if (opts?.useProtected && opts.protectedRate && opts.bcv) {
    if (opts.currency === "BS") {
      equivalentBs = costsBs.invoicedTotal;
      equivalentUsd = costsBs.invoicedTotal / opts.bcv;
    } else {
      equivalentUsd = equivalentUsdFromProtected(
        costsUsd.invoicedTotal,
        opts.protectedRate,
        opts.bcv,
      );
      equivalentBs = costsUsd.invoicedTotal * opts.protectedRate;
    }
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
  status: string;
  id: string;
  notes: string | null;
  invoiceDate: Date | null;
}) {
  const cur = purchase.currency === "BS" ? "Bs" : "USD";
  return {
    id: purchase.id,
    status: purchase.status,
    supplierName: purchase.supplierName,
    invoiceNumber: purchase.invoiceNumber,
    warehouseId: purchase.warehouseId,
    currency: purchase.currency,
    paymentCondition: purchase.paymentCondition,
    creditDays: purchase.creditDays,
    dueDate: purchase.dueDate,
    paymentMethodId: purchase.paymentMethodId,
    invoiceDate: purchase.invoiceDate,
    notes: purchase.notes,
    /** Documento imprimible — sin utilidad/margen/PVP. */
    document: {
      subtotal: num(
        cur === "Bs" ? purchase.subtotalBs : purchase.subtotalUsd,
      ),
      tax: num(cur === "Bs" ? purchase.taxBs : purchase.taxUsd),
      grandTotal: num(
        cur === "Bs" ? purchase.grandTotalBs : purchase.grandTotalUsd,
      ),
      lines: purchase.lines.map((l) => ({
        productId: l.productId,
        presentationId: l.presentationId,
        qty: num(l.qty as Prisma.Decimal),
        qtyBonus: num(l.qtyBonus as Prisma.Decimal),
        unitCost: num(
          cur === "Bs" ? (l.unitCostBs as Prisma.Decimal) : (l.unitCostUsd as Prisma.Decimal),
        ),
        presentationCost: num(
          cur === "Bs"
            ? (l.presentationCostBs as Prisma.Decimal)
            : (l.presentationCostUsd as Prisma.Decimal),
        ),
        lineSubtotal: num(
          cur === "Bs" ? (l.lineCostBs as Prisma.Decimal) : (l.lineCostUsd as Prisma.Decimal),
        ),
        taxable: Boolean(l.taxable),
        lineTax: num(
          cur === "Bs" ? (l.lineTaxBs as Prisma.Decimal) : (l.lineTaxUsd as Prisma.Decimal),
        ),
        lineTotal: num(
          cur === "Bs"
            ? (l.lineTotalWithTaxBs as Prisma.Decimal)
            : (l.lineTotalWithTaxUsd as Prisma.Decimal),
        ),
      })),
    },
  };
}
