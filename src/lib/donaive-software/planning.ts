/**
 * Planificación de compras — mín/máx automático, lead time y sugeridos por proveedor.
 */

import { salesInRange, type DateRange } from "@/lib/donaive-software/reports";
import { saleNetBs, saleNetUsd } from "@/lib/donaive-software/sales";
import type {
  DsProduct,
  DsPurchase,
  DsSale,
  DsStockUrgency,
  DsSupplier,
} from "@/types/donaive-software";

export const PLANNING_SAFETY_DAYS = 2;
export const PLANNING_COVERAGE_TARGET_DAYS = 14;
export const PLANNING_DEFAULT_LOOKBACK = 14;

export type ProductPlanningMetrics = {
  productId: string;
  avgDaily: number;
  minQtyBase: number;
  maxQtyBase: number;
  stockDays: number;
  urgency: DsStockUrgency;
  suggestedQtyBase: number;
  suggestedBoxes: number;
  leadTimeDays: number;
  supplierId: string | null;
  supplierName: string | null;
};

export function soldQtyByProduct(
  sales: DsSale[],
  lookbackDays = PLANNING_DEFAULT_LOOKBACK,
): Map<string, number> {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - (lookbackDays - 1));
  const range: DateRange = {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
  const scoped = salesInRange(sales, range);
  const map = new Map<string, number>();
  for (const s of scoped) {
    for (const line of s.lines) {
      map.set(line.productId, (map.get(line.productId) ?? 0) + line.qtyBase);
    }
  }
  return map;
}

export function avgDailyFromSales(
  soldQty: number,
  lookbackDays: number,
): number {
  const days = Math.max(1, lookbackDays);
  return Math.max(0, soldQty / days);
}

export function calculateMinMaxQty(
  avgDaily: number,
  leadTimeDays: number,
): { minQtyBase: number; maxQtyBase: number } {
  const lead = Math.max(1, leadTimeDays);
  const minQtyBase = Math.ceil(avgDaily * (lead + PLANNING_SAFETY_DAYS));
  const maxQtyBase = Math.ceil(
    Math.max(minQtyBase * 2, avgDaily * PLANNING_COVERAGE_TARGET_DAYS),
  );
  return { minQtyBase, maxQtyBase };
}

export function stockUrgency(input: {
  stock: number;
  avgDaily: number;
  minQtyBase: number;
  maxQtyBase: number;
  leadTimeDays: number;
}): DsStockUrgency {
  const stock = Math.max(0, input.stock);
  const avg = Math.max(0, input.avgDaily);
  const lead = Math.max(1, input.leadTimeDays);
  const stockDays = avg > 0 ? stock / avg : Number.POSITIVE_INFINITY;

  if (stockDays <= lead) return "CRITICAL";
  if (stock <= input.minQtyBase) return "BUY";
  if (stock >= input.maxQtyBase) return "OVER";
  return "OK";
}

export function suggestedOrderQty(stock: number, maxQtyBase: number): number {
  return Math.max(0, Math.ceil(maxQtyBase - Math.max(0, stock)));
}

function resolveSupplierForProduct(
  product: DsProduct,
  suppliers: DsSupplier[],
  purchases: DsPurchase[],
): { supplierId: string | null; supplierName: string | null; leadTimeDays: number } {
  if (product.preferredSupplierId) {
    const s = suppliers.find((x) => x.id === product.preferredSupplierId);
    if (s) {
      return {
        supplierId: s.id,
        supplierName: s.name,
        leadTimeDays: Math.max(1, s.leadTimeDays || 3),
      };
    }
  }

  for (const s of suppliers) {
    if (s.productIds?.includes(product.id)) {
      return {
        supplierId: s.id,
        supplierName: s.name,
        leadTimeDays: Math.max(1, s.leadTimeDays || 3),
      };
    }
  }

  const sorted = [...purchases].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  for (const pur of sorted) {
    if (!pur.supplierId) continue;
    if (pur.lines.some((l) => l.productId === product.id)) {
      const s = suppliers.find((x) => x.id === pur.supplierId);
      return {
        supplierId: pur.supplierId,
        supplierName: pur.supplierName,
        leadTimeDays: Math.max(1, s?.leadTimeDays || 3),
      };
    }
  }

  return { supplierId: null, supplierName: null, leadTimeDays: 3 };
}

export function enrichProductsWithPlanning(input: {
  products: DsProduct[];
  sales: DsSale[];
  suppliers: DsSupplier[];
  purchases: DsPurchase[];
  lookbackDays?: number;
}): DsProduct[] {
  const lookback = input.lookbackDays ?? PLANNING_DEFAULT_LOOKBACK;
  const soldMap = soldQtyByProduct(input.sales, lookback);

  return input.products.map((p) => {
    const sold = soldMap.get(p.id) ?? 0;
    const avgDaily = avgDailyFromSales(sold, lookback);
    const supplierInfo = resolveSupplierForProduct(
      p,
      input.suppliers,
      input.purchases,
    );
    const { minQtyBase, maxQtyBase } = calculateMinMaxQty(
      avgDaily,
      supplierInfo.leadTimeDays,
    );
    return {
      ...p,
      minQtyBase,
      maxQtyBase,
      preferredSupplierId: supplierInfo.supplierId ?? p.preferredSupplierId,
    };
  });
}

export function buildProductPlanningRows(input: {
  products: DsProduct[];
  sales: DsSale[];
  suppliers: DsSupplier[];
  purchases: DsPurchase[];
  lookbackDays?: number;
}): ProductPlanningMetrics[] {
  const lookback = input.lookbackDays ?? PLANNING_DEFAULT_LOOKBACK;
  const enriched = enrichProductsWithPlanning(input);

  return enriched.map((p) => {
    const soldMap = soldQtyByProduct(input.sales, lookback);
    const sold = soldMap.get(p.id) ?? 0;
    const avgDaily = avgDailyFromSales(sold, lookback);
    const supplierInfo = resolveSupplierForProduct(
      p,
      input.suppliers,
      input.purchases,
    );
    const minQtyBase = p.minQtyBase ?? 0;
    const maxQtyBase = p.maxQtyBase ?? 0;
    const stock = Math.max(0, p.stock.qtyBase);
    const stockDays = avgDaily > 0 ? stock / avgDaily : Number.POSITIVE_INFINITY;
    const urgency = stockUrgency({
      stock,
      avgDaily,
      minQtyBase,
      maxQtyBase,
      leadTimeDays: supplierInfo.leadTimeDays,
    });
    const suggestedQtyBase = ["CRITICAL", "BUY"].includes(urgency)
      ? suggestedOrderQty(stock, maxQtyBase)
      : 0;
    const upp = Math.max(1, p.unitsPerBox);

    return {
      productId: p.id,
      avgDaily,
      minQtyBase,
      maxQtyBase,
      stockDays,
      urgency,
      suggestedQtyBase,
      suggestedBoxes:
        upp > 1 ? Math.ceil(suggestedQtyBase / upp) : suggestedQtyBase,
      leadTimeDays: supplierInfo.leadTimeDays,
      supplierId: supplierInfo.supplierId,
      supplierName: supplierInfo.supplierName,
    };
  });
}

export type PlanningRow = ProductPlanningMetrics & {
  name: string;
  sku: string;
  stock: number;
  unitsPerBox: number;
  soldInPeriod: number;
  estimatedCostUsd: number | null;
};

export type SupplierPlanningGroup = {
  supplierId: string | null;
  supplierName: string;
  leadTimeDays: number;
  lines: PlanningRow[];
  totalSuggestedUsd: number;
};

export function buildPurchasePlanning(input: {
  products: DsProduct[];
  sales: DsSale[];
  suppliers: DsSupplier[];
  purchases: DsPurchase[];
  lookbackDays?: number;
}): {
  rows: PlanningRow[];
  bySupplier: SupplierPlanningGroup[];
  criticalCount: number;
  buyCount: number;
} {
  const lookback = input.lookbackDays ?? PLANNING_DEFAULT_LOOKBACK;
  const soldMap = soldQtyByProduct(input.sales, lookback);
  const metrics = buildProductPlanningRows(input);

  const lastCost = new Map<string, number>();
  const sortedPurchases = [...input.purchases].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  for (const pur of sortedPurchases) {
    for (const line of pur.lines) {
      if (lastCost.has(line.productId)) continue;
      const upp = line.buyMode === "BOX" ? Math.max(1, line.unitsPerBox) : 1;
      let unit = line.unitCost;
      if (line.costMode === "PRESENTATION" && line.presentationCost > 0) {
        unit = line.presentationCost / upp;
      } else if (line.costMode === "TOTAL" && line.qty > 0) {
        unit = line.lineTotal / (line.qty * upp);
      }
      if (unit > 0) lastCost.set(line.productId, unit);
    }
  }

  const rows: PlanningRow[] = input.products.map((p) => {
    const m = metrics.find((x) => x.productId === p.id)!;
    const cost =
      lastCost.get(p.id) ??
      (p.stock.unitCostUsd > 0 ? p.stock.unitCostUsd : null);
    return {
      ...m,
      name: p.name,
      sku: p.sku,
      stock: p.stock.qtyBase,
      unitsPerBox: p.unitsPerBox,
      soldInPeriod: soldMap.get(p.id) ?? 0,
      estimatedCostUsd: cost,
    };
  });

  const actionable = rows.filter(
    (r) => r.urgency === "CRITICAL" || r.urgency === "BUY",
  );
  actionable.sort((a, b) => {
    const order = { CRITICAL: 0, BUY: 1, OK: 2, OVER: 3 };
    const diff = order[a.urgency] - order[b.urgency];
    if (diff !== 0) return diff;
    return a.stockDays - b.stockDays;
  });

  const groupMap = new Map<string, SupplierPlanningGroup>();
  for (const row of actionable.filter((r) => r.suggestedQtyBase > 0)) {
    const key = row.supplierId ?? "__none__";
    const cur = groupMap.get(key) ?? {
      supplierId: row.supplierId,
      supplierName: row.supplierName ?? "Sin proveedor asignado",
      leadTimeDays: row.leadTimeDays,
      lines: [],
      totalSuggestedUsd: 0,
    };
    cur.lines.push(row);
    cur.totalSuggestedUsd +=
      (row.estimatedCostUsd ?? 0) * row.suggestedQtyBase;
    groupMap.set(key, cur);
  }

  const bySupplier = [...groupMap.values()].sort((a, b) =>
    a.supplierName.localeCompare(b.supplierName),
  );

  return {
    rows: actionable,
    bySupplier,
    criticalCount: rows.filter((r) => r.urgency === "CRITICAL").length,
    buyCount: rows.filter((r) => r.urgency === "BUY").length,
  };
}

export function planningToCsv(groups: SupplierPlanningGroup[]): string {
  const header =
    "Proveedor,SKU,Producto,Stock,Min,Max,Días stock,Despacho días,Urgencia,Sugerido u.,Sugerido cajas,Costo est. USD";
  const lines = [header];
  for (const g of groups) {
    for (const r of g.lines) {
      lines.push(
        [
          g.supplierName,
          r.sku,
          r.name,
          r.stock,
          r.minQtyBase,
          r.maxQtyBase,
          Number.isFinite(r.stockDays) ? r.stockDays.toFixed(1) : "∞",
          r.leadTimeDays,
          r.urgency,
          r.suggestedQtyBase,
          r.suggestedBoxes,
          r.estimatedCostUsd?.toFixed(2) ?? "",
        ]
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(","),
      );
    }
  }
  return lines.join("\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type DailySalesSummary = {
  date: string;
  tickets: number;
  totalUsd: number;
  totalBs: number;
  avgTicketUsd: number;
  topProducts: { label: string; qtyBase: number; revenueUsd: number }[];
  byMethod: { label: string; usd: number; bs: number }[];
};

export function buildDailySalesSummary(
  sales: DsSale[],
  date?: string,
): DailySalesSummary {
  const day = date ?? new Date().toISOString().slice(0, 10);
  const range = { from: day, to: day };
  const scoped = salesInRange(sales, range);
  let totalUsd = 0;
  let totalBs = 0;
  const methodMap = new Map<string, { usd: number; bs: number }>();
  const productMap = new Map<
    string,
    { label: string; qtyBase: number; revenueUsd: number }
  >();

  for (const s of scoped) {
    totalUsd += saleNetUsd(s);
    totalBs += saleNetBs(s);
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

  return {
    date: day,
    tickets: scoped.length,
    totalUsd,
    totalBs,
    avgTicketUsd: scoped.length > 0 ? totalUsd / scoped.length : 0,
    topProducts: [...productMap.values()]
      .sort((a, b) => b.revenueUsd - a.revenueUsd)
      .slice(0, 8),
    byMethod: [...methodMap.entries()].map(([method, v]) => ({
      label: method,
      usd: v.usd,
      bs: v.bs,
    })),
  };
}
