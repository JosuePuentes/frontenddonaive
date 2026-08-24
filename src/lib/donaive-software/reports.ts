/**
 * Informes y análisis — agregados offline sobre ventas, stock y compras.
 */

import { DS_PAYMENT_LABELS } from "@/lib/donaive-software/sales";
import type {
  DsPaymentMethod,
  DsProduct,
  DsPurchase,
  DsSale,
} from "@/types/donaive-software";

export type DateRange = { from: string; to: string };

export function rangePreset(
  preset: "hoy" | "7d" | "30d" | "mes",
): DateRange {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const fromDate = new Date(today);
  if (preset === "hoy") {
    return { from: to, to };
  }
  if (preset === "7d") {
    fromDate.setDate(fromDate.getDate() - 6);
  } else if (preset === "30d") {
    fromDate.setDate(fromDate.getDate() - 29);
  } else {
    fromDate.setDate(1);
  }
  return { from: fromDate.toISOString().slice(0, 10), to };
}

export function salesInRange(sales: DsSale[], range: DateRange): DsSale[] {
  return sales.filter((s) => {
    if (s.status !== "completed") return false;
    const d = s.createdAt.slice(0, 10);
    return d >= range.from && d <= range.to;
  });
}

export function salesByKind(
  sales: DsSale[],
  kind: "ALL" | "NORMAL" | "FISCAL",
): DsSale[] {
  if (kind === "ALL") return sales;
  return sales.filter((s) => (s.saleKind ?? "NORMAL") === kind);
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T12:00:00");
  const b = new Date(to + "T12:00:00");
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
  return Math.max(1, diff + 1);
}

export type SalesReport = {
  salesCount: number;
  totalUsd: number;
  totalBs: number;
  byMethod: { method: string; label: string; usd: number; bs: number }[];
  byDay: { date: string; usd: number; tickets: number }[];
  topProducts: {
    productId: string;
    label: string;
    qtyBase: number;
    revenueUsd: number;
  }[];
};

export function buildSalesReport(sales: DsSale[], range: DateRange): SalesReport {
  const scoped = salesInRange(sales, range);
  let totalUsd = 0;
  let totalBs = 0;
  const methodMap = new Map<string, { usd: number; bs: number }>();
  const dayMap = new Map<string, { usd: number; tickets: number }>();
  const productMap = new Map<
    string,
    { label: string; qtyBase: number; revenueUsd: number }
  >();

  for (const s of scoped) {
    totalUsd += s.totalUsd;
    totalBs += s.totalBs;
    const day = s.createdAt.slice(0, 10);
    const d = dayMap.get(day) ?? { usd: 0, tickets: 0 };
    d.usd += s.totalUsd;
    d.tickets += 1;
    dayMap.set(day, d);

    for (const pay of s.payments) {
      const m = methodMap.get(pay.method) ?? { usd: 0, bs: 0 };
      if (pay.currency === "USD") m.usd += pay.amount;
      else m.bs += pay.amount;
      methodMap.set(pay.method, m);
    }

    for (const line of s.lines) {
      const p = productMap.get(line.productId) ?? {
        label: line.productLabel,
        qtyBase: 0,
        revenueUsd: 0,
      };
      p.qtyBase += line.qtyBase;
      p.revenueUsd += line.lineTotalUsd;
      productMap.set(line.productId, p);
    }
  }

  const byMethod = [...methodMap.entries()]
    .map(([method, v]) => ({
      method,
      label: DS_PAYMENT_LABELS[method as DsPaymentMethod] ?? method,
      usd: v.usd,
      bs: v.bs,
    }))
    .sort((a, b) => b.usd + b.bs / 1000 - (a.usd + a.bs / 1000));

  const byDay = [...dayMap.entries()]
    .map(([date, v]) => ({ date, usd: v.usd, tickets: v.tickets }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topProducts = [...productMap.entries()]
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.revenueUsd - a.revenueUsd)
    .slice(0, 10);

  return {
    salesCount: scoped.length,
    totalUsd,
    totalBs,
    byMethod,
    byDay,
    topProducts,
  };
}

export function buildSalesReportByKind(
  sales: DsSale[],
  range: DateRange,
  kind: "ALL" | "NORMAL" | "FISCAL",
): SalesReport {
  return buildSalesReport(salesByKind(sales, kind), range);
}

export type InventoryReportRow = {
  productId: string;
  name: string;
  sku: string;
  qtyBase: number;
  unitsPerBox: number;
  unitCostUsd: number;
  valueUsd: number;
  saleUnitUsd: number;
  lowStock: boolean;
};

export type InventoryReport = {
  rows: InventoryReportRow[];
  totalUnits: number;
  totalValueUsd: number;
  lowStockCount: number;
};

export function buildInventoryReport(products: DsProduct[]): InventoryReport {
  const rows: InventoryReportRow[] = products.map((p) => {
    const qty = Math.max(0, p.stock.qtyBase);
    const cost = Math.max(0, p.stock.unitCostUsd);
    const lowStock =
      (p.minQtyBase ?? 0) > 0
        ? qty < p.minQtyBase!
        : p.unitsPerBox > 1
          ? qty < p.unitsPerBox
          : qty < 5;
    return {
      productId: p.id,
      name: p.name,
      sku: p.sku,
      qtyBase: qty,
      unitsPerBox: p.unitsPerBox,
      unitCostUsd: cost,
      valueUsd: qty * cost,
      saleUnitUsd: p.saleUnitUsd ?? 0,
      lowStock,
    };
  });
  rows.sort((a, b) => b.valueUsd - a.valueUsd);
  return {
    rows,
    totalUnits: rows.reduce((a, r) => a + r.qtyBase, 0),
    totalValueUsd: rows.reduce((a, r) => a + r.valueUsd, 0),
    lowStockCount: rows.filter((r) => r.lowStock).length,
  };
}

export function buildInventoryReportFromStock(
  products: DsProduct[],
  stockByProduct: Record<string, number>,
): InventoryReport {
  const rows: InventoryReportRow[] = products.map((p) => {
    const qty = Math.max(0, Number(stockByProduct[p.id]) || 0);
    const cost = Math.max(0, p.stock.unitCostUsd);
    return {
      productId: p.id,
      name: p.name,
      sku: p.sku,
      qtyBase: qty,
      unitsPerBox: p.unitsPerBox,
      unitCostUsd: cost,
      valueUsd: qty * cost,
      saleUnitUsd: p.saleUnitUsd ?? 0,
      lowStock: qty <= 0,
    };
  });
  rows.sort((a, b) => b.valueUsd - a.valueUsd);
  return {
    rows,
    totalUnits: rows.reduce((a, r) => a + r.qtyBase, 0),
    totalValueUsd: rows.reduce((a, r) => a + r.valueUsd, 0),
    lowStockCount: rows.filter((r) => r.lowStock).length,
  };
}

export type ReplenishmentRow = {
  productId: string;
  name: string;
  sku: string;
  stock: number;
  unitsPerBox: number;
  soldInPeriod: number;
  avgDaily: number;
  coverageDays: number;
  needQtyBase: number;
  suggestedQtyBase: number;
  suggestedBoxes: number;
  lastPurchaseCostUsd: number | null;
};

export function buildReplenishmentAnalysis(input: {
  products: DsProduct[];
  sales: DsSale[];
  purchases: DsPurchase[];
  coverageDays: number;
  lookbackDays?: number;
}): ReplenishmentRow[] {
  const lookback = Math.max(1, input.lookbackDays ?? 14);
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - (lookback - 1));
  const range: DateRange = {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
  const scoped = salesInRange(input.sales, range);
  const soldMap = new Map<string, number>();
  for (const s of scoped) {
    for (const line of s.lines) {
      soldMap.set(
        line.productId,
        (soldMap.get(line.productId) ?? 0) + line.qtyBase,
      );
    }
  }

  const lastCost = new Map<string, number>();
  const sortedPurchases = [...input.purchases].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  for (const pur of sortedPurchases) {
    for (const line of pur.lines) {
      if (lastCost.has(line.productId)) continue;
      // rough unit cost from line (invoice currency ignored for suggestion display)
      const upp =
        line.buyMode === "BOX" ? Math.max(1, line.unitsPerBox) : 1;
      let unit = line.unitCost;
      if (line.costMode === "PRESENTATION" && line.presentationCost > 0) {
        unit = line.presentationCost / upp;
      } else if (line.costMode === "TOTAL" && line.qty > 0) {
        unit = line.lineTotal / (line.qty * upp);
      }
      if (unit > 0) lastCost.set(line.productId, unit);
    }
  }

  const days = daysBetween(range.from, range.to);
  const coverage = Math.max(1, input.coverageDays);

  return input.products
    .map((p) => {
      const sold = soldMap.get(p.id) ?? 0;
      const avgDaily = sold / days;
      const need = avgDaily * coverage - p.stock.qtyBase;
      const suggested = Math.max(0, Math.ceil(need));
      const upp = Math.max(1, p.unitsPerBox);
      const suggestedBoxes =
        upp > 1 ? Math.ceil(suggested / upp) : suggested;
      return {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock.qtyBase,
        unitsPerBox: p.unitsPerBox,
        soldInPeriod: sold,
        avgDaily,
        coverageDays: coverage,
        needQtyBase: Math.max(0, need),
        suggestedQtyBase: suggested,
        suggestedBoxes,
        lastPurchaseCostUsd:
          lastCost.get(p.id) ?? (p.stock.unitCostUsd > 0 ? p.stock.unitCostUsd : null),
      };
    })
    .filter((r) => r.soldInPeriod > 0 || r.suggestedQtyBase > 0)
    .sort((a, b) => b.suggestedQtyBase - a.suggestedQtyBase);
}

export type PurchaseSummary = {
  purchaseCount: number;
  totalSpend: number;
  bySupplier: { name: string; total: number; count: number }[];
};

export function buildPurchaseSummary(
  purchases: DsPurchase[],
  range: DateRange,
): PurchaseSummary {
  const scoped = purchases.filter((p) => {
    const d = (p.invoiceDate || p.createdAt).slice(0, 10);
    return d >= range.from && d <= range.to;
  });
  const bySupplierMap = new Map<string, { total: number; count: number }>();
  let totalSpend = 0;
  for (const p of scoped) {
    totalSpend += p.grandTotal;
    const cur = bySupplierMap.get(p.supplierName) ?? { total: 0, count: 0 };
    cur.total += p.grandTotal;
    cur.count += 1;
    bySupplierMap.set(p.supplierName, cur);
  }
  return {
    purchaseCount: scoped.length,
    totalSpend,
    bySupplier: [...bySupplierMap.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total),
  };
}
